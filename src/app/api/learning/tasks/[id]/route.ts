import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/api-helpers";

async function getParams(context: unknown): Promise<{ id: string }> {
  const ctx = context as { params: Promise<{ id: string }> | { id: string } };
  return ctx.params instanceof Promise ? await ctx.params : ctx.params;
}

/** DELETE /api/learning/tasks/[id] - Delete a task package and all related data */
export const DELETE = withErrorHandling(async (
  request: NextRequest,
  context: unknown
) => {
  const { id: taskId } = await getParams(context);

  // Verify task exists
  const task = await prisma.taskPackage.findUnique({
    where: { id: taskId },
    include: {
      uploadedDocuments: true,
      extractedRequirements: true,
    },
  });

  if (!task) {
    return apiError("Task package not found", 404);
  }

  // Delete all related data in correct order (due to foreign key constraints)
  
  // 1. Delete uploaded documents
  await prisma.uploadedDocument.deleteMany({
    where: { taskPackageId: taskId },
  });

  // 2. Delete extracted requirements
  await prisma.extractedRequirement.deleteMany({
    where: { taskPackageId: taskId },
  });

  // 3. Remove this task from knowledge nodes' relatedTaskIds
  const knowledgeNodes = await prisma.knowledgeNode.findMany({
    where: {
      relatedTaskIds: {
        contains: taskId,
      },
    },
  });

  for (const node of knowledgeNodes) {
    const relatedTasks = JSON.parse(node.relatedTaskIds || "[]");
    const updatedTasks = relatedTasks.filter((id: string) => id !== taskId);
    
    if (updatedTasks.length === 0) {
      // If this was the only task linked to the node, delete the node
      await prisma.knowledgeNode.delete({
        where: { id: node.id },
      });
    } else {
      // Otherwise, just remove this task from the list
      await prisma.knowledgeNode.update({
        where: { id: node.id },
        data: {
          relatedTaskIds: JSON.stringify(updatedTasks),
        },
      });
    }
  }

  // 4. Finally, delete the task package itself
  await prisma.taskPackage.delete({
    where: { id: taskId },
  });

  return apiSuccess({
    message: "Task package deleted successfully",
    deletedTaskId: taskId,
    documentsDeleted: task.uploadedDocuments.length,
    requirementsDeleted: task.extractedRequirements.length,
  });
});

/** GET /api/learning/tasks/[id] - Get a single task package */
export const GET = withErrorHandling(async (
  request: NextRequest,
  context: unknown
) => {
  const { id } = await getParams(context);
  
  const task = await prisma.taskPackage.findUnique({
    where: { id },
    include: {
      uploadedDocuments: {
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          extractedText: true,
          createdAt: true,
        },
      },
      extractedRequirements: {
        select: {
          id: true,
          content: true,
          type: true,
          priority: true,
          sourceReference: true,
        },
      },
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!task) {
    return apiError("Task package not found", 404);
  }

  return apiSuccess(task);
});
