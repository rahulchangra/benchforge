import JSZip from "jszip";
import { ExtractedZipTask, parseZipTaskArchive } from "./zip-task-parser";

export interface MultiTaskZipResult {
  tasks: ExtractedZipTask[];
  totalFiles: number;
  detectedTaskFolders: string[];
}

/**
 * Detects if a ZIP contains multiple task directories or a single task.
 * 
 * Structure 1 (Multiple Tasks):
 *   task-1/
 *     problem.md
 *     test.patch
 *     solution.patch
 *     Dockerfile
 *     test.sh
 *   task-2/
 *     problem.md
 *     ...
 * 
 * Structure 2 (Single Task):
 *   problem.md
 *   test.patch
 *   solution.patch
 *   ...
 */
export async function parseMultiTaskZip(
  data: ArrayBuffer | Blob | Uint8Array,
  archiveFilename = "multi-task.zip"
): Promise<MultiTaskZipResult> {
  const zip = await JSZip.loadAsync(data);
  
  // Map folder paths to their files
  const folderMap = new Map<string, JSZip.JSZipObject[]>();
  let hasRootLevelTaskFiles = false;
  
  const taskFilePatterns = [
    "problem.md",
    "task.md",
    "test.patch",
    "solution.patch",
    "dockerfile",
    "test.sh"
  ];

  zip.forEach((relativePath, entry) => {
    if (entry.dir) return;
    
    // Clean path
    const cleanPath = relativePath.replace(/\\/g, "/");
    if (cleanPath.includes("__MACOSX") || cleanPath.includes(".DS_Store")) return;
    
    // Check if root-level task files exist
    const pathParts = cleanPath.split("/");
    const fileName = pathParts[pathParts.length - 1].toLowerCase();
    
    if (pathParts.length === 1 && taskFilePatterns.some(pattern => fileName.includes(pattern))) {
      hasRootLevelTaskFiles = true;
    }
    
    // Group files by top-level folder
    if (pathParts.length > 1) {
      const topFolder = pathParts[0];
      if (!folderMap.has(topFolder)) {
        folderMap.set(topFolder, []);
      }
      folderMap.get(topFolder)!.push(entry);
    }
  });

  const tasks: ExtractedZipTask[] = [];
  const detectedTaskFolders: string[] = [];
  let totalFiles = 0;

  // Case 1: Root-level task files (single task)
  if (hasRootLevelTaskFiles || folderMap.size === 0) {
    const singleTask = await parseZipTaskArchive(data, archiveFilename);
    tasks.push(singleTask);
    totalFiles = singleTask.allFiles.length;
    detectedTaskFolders.push("(root)");
    
    return { tasks, totalFiles, detectedTaskFolders };
  }

  // Case 2: Multiple task folders
  for (const [folderName, files] of folderMap.entries()) {
    // Check if this folder contains task files
    const hasTaskFiles = files.some(file => {
      const fileName = file.name.toLowerCase();
      return taskFilePatterns.some(pattern => fileName.includes(pattern));
    });

    if (!hasTaskFiles) continue;

    // Create a sub-ZIP for this task folder
    const taskZip = new JSZip();
    
    for (const file of files) {
      // Remove folder prefix from path
      const fullPath = file.name;
      const relativePath = fullPath.split("/").slice(1).join("/");
      
      if (!relativePath) continue; // Skip folder entry itself
      
      const content = await file.async("uint8array");
      taskZip.file(relativePath, content);
    }

    // Extract this task
    const taskBlob = await taskZip.generateAsync({ type: "arraybuffer" });
    const extractedTask = await parseZipTaskArchive(taskBlob, `${folderName}.zip`);
    
    tasks.push(extractedTask);
    totalFiles += extractedTask.allFiles.length;
    detectedTaskFolders.push(folderName);
  }

  // If no valid task folders found, treat entire ZIP as single task
  if (tasks.length === 0) {
    const singleTask = await parseZipTaskArchive(data, archiveFilename);
    tasks.push(singleTask);
    totalFiles = singleTask.allFiles.length;
    detectedTaskFolders.push("(entire archive)");
  }

  return { tasks, totalFiles, detectedTaskFolders };
}
