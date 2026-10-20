import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { apiSuccess, apiError, parseBody, withErrorHandling } from "@/lib/api-helpers";
import { parseMultiTaskZip } from "@/lib/zip-multi-task-parser";

const UploadMultiTaskZipSchema = z.object({
  workspaceId: z.string().min(1),
  zipFileBase64: z.string().min(1), // Base64 encoded ZIP
  filename: z.string().min(1),
});

/** POST /api/learning/tasks/upload-zip - Upload ZIP with multiple approved tasks */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, UploadMultiTaskZipSchema);
  if (error) return error;

  // Verify workspace exists
  const workspace = await prisma.learningWorkspace.findUnique({
    where: { id: data.workspaceId },
  });
  if (!workspace) return apiError("Workspace not found", 404);

  try {
    // Decode base64 ZIP
    const zipBuffer = Buffer.from(data.zipFileBase64, "base64");
    
    // Parse multi-task ZIP
    const { tasks, totalFiles, detectedTaskFolders } = await parseMultiTaskZip(
      zipBuffer,
      data.filename
    );

    if (tasks.length === 0) {
      return apiError("No valid tasks found in ZIP archive", 400);
    }

    const createdTasks = [];
    const allKnowledgeNodes = [];

    // Create a task package for EACH extracted task
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const folderName = detectedTaskFolders[i];

      const taskPackage = await prisma.taskPackage.create({
        data: {
          workspaceId: data.workspaceId,
          title: folderName !== "(root)" ? `${task.title} [${folderName}]` : task.title,
          description: task.description,
          domain: task.domain,
          category: task.category,
          tags: JSON.stringify(task.tags ?? []),
        },
      });

      // Store ALL extracted files as documents
      for (const file of task.allFiles) {
        await prisma.uploadedDocument.create({
          data: {
            taskPackageId: taskPackage.id,
            filename: file.filename,
            originalName: file.filename,
            mimeType: file.mimeType,
            size: file.size,
            storagePath: `/uploads/${taskPackage.id}/${file.filename}`,
            extractedText: file.content ?? null,
          },
        });
      }

      // Store synthesized requirements
      for (const req of task.synthesizedRequirements) {
        await prisma.extractedRequirement.create({
          data: {
            taskPackageId: taskPackage.id,
            content: req.content,
            type: req.type,
            priority: req.priority,
            sourceReference: req.sourceReference,
          },
        });
      }

      // Collect knowledge nodes (will create after all tasks)
      allKnowledgeNodes.push({
        task: taskPackage,
        nodes: task.synthesizedKnowledgeNodes,
      });

      createdTasks.push(taskPackage);
    }

    // Create knowledge graph entries from ALL tasks
    for (const { task, nodes } of allKnowledgeNodes) {
      for (const kn of nodes) {
        // Check if similar knowledge node already exists
        const existing = await prisma.knowledgeNode.findFirst({
          where: {
            workspaceId: data.workspaceId,
            type: kn.type,
            name: kn.name,
          },
        });

        if (existing) {
          // Update confidence and add this task to related tasks
          const relatedTasks = JSON.parse(existing.relatedTaskIds || "[]");
          if (!relatedTasks.includes(task.id)) {
            relatedTasks.push(task.id);
            await prisma.knowledgeNode.update({
              where: { id: existing.id },
              data: {
                confidence: Math.min(1.0, (existing.confidence || 0.9) + 0.05),
                relatedTaskIds: JSON.stringify(relatedTasks),
              },
            });
          }
        } else {
          // Create new knowledge node
          await prisma.knowledgeNode.create({
            data: {
              workspaceId: data.workspaceId,
              type: kn.type,
              name: kn.name,
              definition: kn.definition,
              confidence: kn.confidence,
              reviewStatus: "approved",
              relatedTaskIds: JSON.stringify([task.id]),
            },
          });
        }
      }
    }

    return apiSuccess({
      message: `Successfully extracted ${tasks.length} task(s) from ZIP`,
      tasksCreated: tasks.length,
      totalFiles,
      detectedFolders: detectedTaskFolders,
      taskPackages: createdTasks.map(t => ({
        id: t.id,
        title: t.title,
        domain: t.domain,
        category: t.category,
      })),
    });
  } catch (err: any) {
    console.error("ZIP upload error:", err);
    return apiError(err.message || "Failed to process ZIP archive", 500);
  }
});
