"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  FileArchive,
  FileCode,
  FileText,
  Terminal,
  Container,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  FolderTree,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import {
  parseZipTaskArchive,
  createSampleBenchmarkZip,
  ExtractedZipTask,
} from "@/lib/zip-task-parser";

interface ZipTaskExtractorProps {
  workspaceId: string;
  onSuccess: (taskPackageId: string) => void;
  onCancel?: () => void;
}

export function ZipTaskExtractor({
  workspaceId,
  onSuccess,
  onCancel,
}: ZipTaskExtractorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedZipTask | null>(null);
  const [zipFileName, setZipFileName] = useState<string>("");
  const [zipFileSize, setZipFileSize] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Editable fields prefilled from extraction
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const processZipFile = async (file: File | Blob, name: string) => {
    setParsing(true);
    setZipFileName(name);
    setZipFileSize(file.size);

    try {
      // Convert to base64 and upload directly to server for multi-task extraction
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Upload to server for multi-task extraction
      setSubmitting(true);
      const res = await fetch("/api/learning/tasks/upload-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          zipFileBase64: base64,
          filename: name,
        }),
      });

      const json = await res.json();
      
      if (json.success && json.data) {
        toast({
          type: "success",
          title: `${json.data.tasksCreated} Task(s) Extracted!`,
          description: `Successfully extracted ${json.data.tasksCreated} task(s) with ${json.data.totalFiles} files. Knowledge graph updated.`,
        });
        
        // Reset form and notify success
        setExtractedData(null);
        onSuccess(json.data.taskPackages[0]?.id || "");
      } else {
        toast({
          type: "error",
          title: "Extraction Failed",
          description: json.error || "Failed to extract tasks from ZIP",
        });
      }
    } catch (err: any) {
      console.error("ZIP upload error:", err);
      toast({
        type: "error",
        title: "Upload Failed",
        description:
          err?.message || "Could not upload ZIP file. Check your connection.",
      });
      setExtractedData(null);
    } finally {
      setParsing(false);
      setSubmitting(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processZipFile(file, file.name);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast({
          type: "error",
          title: "Invalid file format",
          description: "Please upload a .zip archive containing task benchmark files.",
        });
        return;
      }
      processZipFile(file, file.name);
    }
  };

  const handleLoadSample = async () => {
    setParsing(true);
    try {
      const { blob, filename } = await createSampleBenchmarkZip();
      await processZipFile(blob, filename);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Sample generation error",
        description: err?.message || "Failed to generate sample benchmark archive.",
      });
      setParsing(false);
    }
  };

  const handleSaveTaskPackage = async () => {
    if (!extractedData) return;
    if (!title.trim()) {
      toast({
        type: "error",
        title: "Validation error",
        description: "Task title cannot be empty.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // 1. Prepare documents array
      const documents: {
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        extractedText?: string;
      }[] = [];

      // Add key benchmark files first
      if (extractedData.problemMd) {
        documents.push({
          filename: extractedData.problemMd.filename,
          originalName: extractedData.problemMd.filename,
          mimeType: "text/markdown",
          size: extractedData.problemMd.content.length,
          extractedText: extractedData.problemMd.content,
        });
      }

      if (extractedData.testPatch) {
        documents.push({
          filename: extractedData.testPatch.filename,
          originalName: extractedData.testPatch.filename,
          mimeType: "text/x-diff",
          size: extractedData.testPatch.content.length,
          extractedText: extractedData.testPatch.content,
        });
      }

      if (extractedData.solutionPatch) {
        documents.push({
          filename: extractedData.solutionPatch.filename,
          originalName: extractedData.solutionPatch.filename,
          mimeType: "text/x-diff",
          size: extractedData.solutionPatch.content.length,
          extractedText: extractedData.solutionPatch.content,
        });
      }

      if (extractedData.dockerfile) {
        documents.push({
          filename: extractedData.dockerfile.filename,
          originalName: extractedData.dockerfile.filename,
          mimeType: "text/x-dockerfile",
          size: extractedData.dockerfile.content.length,
          extractedText: extractedData.dockerfile.content,
        });
      }

      if (extractedData.testScript) {
        documents.push({
          filename: extractedData.testScript.filename,
          originalName: extractedData.testScript.filename,
          mimeType: "application/x-sh",
          size: extractedData.testScript.content.length,
          extractedText: extractedData.testScript.content,
        });
      }

      // Add remaining files
      for (const file of extractedData.allFiles) {
        const isAlreadyAdded = documents.some((d) => d.filename === file.filename);
        if (!isAlreadyAdded) {
          documents.push({
            filename: file.filename,
            originalName: file.filename,
            mimeType: file.mimeType,
            size: file.size,
            extractedText: file.content,
          });
        }
      }

      // 2. Prepare tags
      const parsedTags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // 3. Post to API
      const res = await fetch("/api/learning/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: title.trim(),
          description: description.trim() || undefined,
          domain: domain.trim() || undefined,
          category: category.trim() || undefined,
          tags: parsedTags,
          documents,
          requirements: extractedData.synthesizedRequirements,
          knowledgeNodes: extractedData.synthesizedKnowledgeNodes,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        toast({
          type: "success",
          title: "Task Package Ingested",
          description: `"${title}" created with ${documents.length} artifacts and ${extractedData.synthesizedKnowledgeNodes.length} knowledge nodes.`,
        });
        onSuccess(json.data.id);
      } else {
        toast({
          type: "error",
          title: "Ingestion Failed",
          description: json.error || "Failed to create task package",
        });
      }
    } catch (err: any) {
      toast({
        type: "error",
        title: "Submission Error",
        description: err?.message || "Network error occurred while creating task package.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderDiffViewer = (diffText: string) => {
    const lines = diffText.split(/\r?\n/);
    return (
      <div className="font-mono text-xs rounded-lg bg-neutral-950 border border-neutral-800 p-3 overflow-x-auto max-h-[380px] space-y-0.5 select-text">
        {lines.map((line, idx) => {
          let lineClass = "text-neutral-400";
          let bgClass = "hover:bg-neutral-900/50";

          if (line.startsWith("diff --git") || line.startsWith("index ")) {
            lineClass = "text-blue-400 font-semibold";
            bgClass = "bg-blue-950/20";
          } else if (line.startsWith("---") || line.startsWith("+++")) {
            lineClass = "text-amber-400 font-semibold";
            bgClass = "bg-amber-950/20";
          } else if (line.startsWith("@@")) {
            lineClass = "text-purple-400 font-semibold";
            bgClass = "bg-purple-950/30";
          } else if (line.startsWith("+")) {
            lineClass = "text-emerald-400";
            bgClass = "bg-emerald-950/30";
          } else if (line.startsWith("-")) {
            lineClass = "text-rose-400";
            bgClass = "bg-rose-950/30";
          }

          return (
            <div key={idx} className={`flex px-2 py-0.5 rounded ${bgClass} ${lineClass}`}>
              <span className="w-8 shrink-0 text-neutral-600 select-none text-right pr-2">
                {idx + 1}
              </span>
              <span className="whitespace-pre">{line}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone (shown if no zip extracted yet) */}
      {!extractedData ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
              : "border-neutral-700/70 hover:border-blue-400/60 bg-neutral-900/40 hover:bg-neutral-900/70"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400 shadow-inner">
              {parsing ? (
                <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
              ) : (
                <UploadCloud className="h-7 w-7" />
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-neutral-100">
                {parsing ? "Extracting & Parsing Archive..." : "Drop your benchmark task .ZIP file here"}
              </h3>
              <p className="mt-1 text-xs text-neutral-400 max-w-md mx-auto">
                Automatically extracts and structures <code className="text-blue-300">problem.md</code>,{" "}
                <code className="text-emerald-300">test.patch</code>,{" "}
                <code className="text-purple-300">solution.patch</code>,{" "}
                <code className="text-amber-300">Dockerfile</code>, and runner scripts.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Badge variant="outline" className="text-[11px] bg-neutral-900 text-neutral-300 border-neutral-700">
                problem.md
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-emerald-950/40 text-emerald-300 border-emerald-800">
                test.patch
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-purple-950/40 text-purple-300 border-purple-800">
                solution.patch
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-amber-950/40 text-amber-300 border-amber-800">
                Dockerfile
              </Badge>
              <Badge variant="outline" className="text-[11px] bg-blue-950/40 text-blue-300 border-blue-800">
                metadata.json
              </Badge>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-2 border-neutral-700 hover:border-neutral-500"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <FileArchive size={14} /> Browse .ZIP File
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="text-xs gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample();
                }}
              >
                <Sparkles size={14} /> Load Sample Benchmark ZIP
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Extracted Data Inspector */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-neutral-100 text-sm">{zipFileName}</h4>
                  <Badge variant="success" className="text-[10px]">
                    Extracted
                  </Badge>
                  <span className="text-xs text-neutral-500">
                    ({(zipFileSize / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-400">
                  <span>{extractedData.allFiles.length} files in archive</span>
                  {extractedData.testPatch && (
                    <span className="text-emerald-400 font-medium">
                      • {extractedData.testPatch.framework}
                    </span>
                  )}
                  {extractedData.dockerfile?.parsed.baseImage && (
                    <span className="text-amber-400">
                      • Image: {extractedData.dockerfile.parsed.baseImage}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-neutral-400 hover:text-neutral-200 gap-1.5"
                onClick={() => {
                  setExtractedData(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <RefreshCw size={12} /> Upload Different ZIP
              </Button>
            </div>
          </div>

          {/* Tabbed Inspector */}
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap border-b border-neutral-800 rounded-none bg-transparent p-0 pb-1">
              <TabsTrigger value="config" className="gap-1.5 text-xs py-2 px-3">
                <FileText size={14} /> Task Config & Metadata
              </TabsTrigger>
              <TabsTrigger value="problem" className="gap-1.5 text-xs py-2 px-3">
                <FileCode size={14} />
                Problem Statement
                {extractedData.problemMd && (
                  <Badge variant="outline" className="ml-1 text-[10px] bg-blue-950/50 text-blue-300 border-blue-800">
                    Found
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="test-patch" className="gap-1.5 text-xs py-2 px-3">
                <Layers size={14} />
                Test Patch
                {extractedData.testPatch && (
                  <Badge variant="outline" className="ml-1 text-[10px] bg-emerald-950/50 text-emerald-300 border-emerald-800">
                    +{extractedData.testPatch.stats.insertions} / -{extractedData.testPatch.stats.deletions}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="solution-patch" className="gap-1.5 text-xs py-2 px-3">
                <Layers size={14} />
                Solution Patch
                {extractedData.solutionPatch && (
                  <Badge variant="outline" className="ml-1 text-[10px] bg-purple-950/50 text-purple-300 border-purple-800">
                    +{extractedData.solutionPatch.stats.insertions} / -{extractedData.solutionPatch.stats.deletions}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="container" className="gap-1.5 text-xs py-2 px-3">
                <Container size={14} />
                Container & Runner
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-1.5 text-xs py-2 px-3">
                <Sparkles size={14} />
                Knowledge Graph
                <Badge variant="outline" className="ml-1 text-[10px] bg-cyan-950/50 text-cyan-300 border-cyan-800">
                  {extractedData.synthesizedKnowledgeNodes.length} Nodes
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="all-files" className="gap-1.5 text-xs py-2 px-3">
                <FolderTree size={14} />
                Archive Files ({extractedData.allFiles.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB: CONFIG */}
            <TabsContent value="config" className="space-y-4 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Task Title</span>
                    <span className="text-[11px] text-neutral-500 font-normal">Auto-extracted</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Task title"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 px-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                    <span>Domain</span>
                    <span className="text-[11px] text-neutral-500 font-normal">Inferred</span>
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Domain (e.g., Python Backend & Systems)"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 px-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task overview and reproduction scope"
                  rows={3}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 px-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category (e.g., Bug Fix / Concurrency)"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 px-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="python, pytest, docker, concurrency"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 px-3.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB: PROBLEM MD */}
            <TabsContent value="problem" className="pt-3">
              {extractedData.problemMd ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5 font-mono">
                      <FileText size={13} /> {extractedData.problemMd.filename}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() =>
                        handleCopy(extractedData.problemMd!.content, "problem")
                      }
                    >
                      {copiedKey === "problem" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedKey === "problem" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-4 max-h-[380px] overflow-y-auto font-mono text-xs text-neutral-200 whitespace-pre-wrap select-text leading-relaxed">
                    {extractedData.problemMd.content}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500 text-sm">
                  <AlertCircle className="mx-auto mb-2 text-neutral-600" size={28} />
                  No <code className="text-neutral-400">problem.md</code> or <code className="text-neutral-400">task.md</code> found in the zip.
                </div>
              )}
            </TabsContent>

            {/* TAB: TEST PATCH */}
            <TabsContent value="test-patch" className="pt-3">
              {extractedData.testPatch ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neutral-300">
                        {extractedData.testPatch.filename}
                      </span>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-800 bg-emerald-950/30">
                        {extractedData.testPatch.framework}
                      </Badge>
                      <Badge variant="outline" className="text-neutral-400 border-neutral-800">
                        {extractedData.testPatch.stats.isUnifiedDiff ? "Unified Diff Format" : "Custom Diff"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-mono">+{extractedData.testPatch.stats.insertions}</span>
                      <span className="text-rose-400 font-mono">-{extractedData.testPatch.stats.deletions}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() =>
                          handleCopy(extractedData.testPatch!.content, "testPatch")
                        }
                      >
                        {copiedKey === "testPatch" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copiedKey === "testPatch" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  {extractedData.testPatch.stats.modifiedFiles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                      <span className="text-neutral-500">Targeted test files:</span>
                      {extractedData.testPatch.stats.modifiedFiles.map((f, i) => (
                        <code key={i} className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-emerald-300 text-[11px]">
                          {f}
                        </code>
                      ))}
                    </div>
                  )}

                  {renderDiffViewer(extractedData.testPatch.content)}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500 text-sm">
                  <AlertCircle className="mx-auto mb-2 text-neutral-600" size={28} />
                  No <code className="text-neutral-400">test.patch</code> or <code className="text-neutral-400">*.test.patch</code> found in the zip.
                </div>
              )}
            </TabsContent>

            {/* TAB: SOLUTION PATCH */}
            <TabsContent value="solution-patch" className="pt-3">
              {extractedData.solutionPatch ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-neutral-300">
                        {extractedData.solutionPatch.filename}
                      </span>
                      <Badge variant="outline" className="text-purple-400 border-purple-800 bg-purple-950/30">
                        Target Fix Patch
                      </Badge>
                      <Badge variant="outline" className="text-neutral-400 border-neutral-800">
                        {extractedData.solutionPatch.stats.isUnifiedDiff ? "Unified Diff Format" : "Custom Diff"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-mono">+{extractedData.solutionPatch.stats.insertions}</span>
                      <span className="text-rose-400 font-mono">-{extractedData.solutionPatch.stats.deletions}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() =>
                          handleCopy(extractedData.solutionPatch!.content, "solPatch")
                        }
                      >
                        {copiedKey === "solPatch" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copiedKey === "solPatch" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  {extractedData.solutionPatch.stats.modifiedFiles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                      <span className="text-neutral-500">Modified source files:</span>
                      {extractedData.solutionPatch.stats.modifiedFiles.map((f, i) => (
                        <code key={i} className="rounded bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-purple-300 text-[11px]">
                          {f}
                        </code>
                      ))}
                    </div>
                  )}

                  {renderDiffViewer(extractedData.solutionPatch.content)}
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500 text-sm">
                  <AlertCircle className="mx-auto mb-2 text-neutral-600" size={28} />
                  No <code className="text-neutral-400">solution.patch</code> found in the zip archive.
                </div>
              )}
            </TabsContent>

            {/* TAB: CONTAINER & RUNNER */}
            <TabsContent value="container" className="pt-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dockerfile */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-neutral-300 flex items-center gap-1.5">
                      <Container size={14} className="text-amber-400" />
                      {extractedData.dockerfile ? extractedData.dockerfile.filename : "Dockerfile (not found)"}
                    </span>
                    {extractedData.dockerfile?.parsed.baseImage && (
                      <Badge variant="outline" className="text-amber-400 border-amber-800 text-[10px]">
                        {extractedData.dockerfile.parsed.baseImage}
                      </Badge>
                    )}
                  </div>
                  {extractedData.dockerfile ? (
                    <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-3 max-h-[300px] overflow-y-auto font-mono text-xs text-neutral-300 whitespace-pre select-text">
                      {extractedData.dockerfile.content}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-neutral-950/50 border border-neutral-800/60 p-6 text-center text-xs text-neutral-500">
                      No Dockerfile present
                    </div>
                  )}
                </div>

                {/* test.sh */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-neutral-300 flex items-center gap-1.5">
                      <Terminal size={14} className="text-blue-400" />
                      {extractedData.testScript ? extractedData.testScript.filename : "test.sh (not found)"}
                    </span>
                    {extractedData.testScript && (
                      <Badge variant="outline" className="text-blue-400 border-blue-800 text-[10px]">
                        Execution Script
                      </Badge>
                    )}
                  </div>
                  {extractedData.testScript ? (
                    <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-3 max-h-[300px] overflow-y-auto font-mono text-xs text-neutral-300 whitespace-pre select-text">
                      {extractedData.testScript.content}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-neutral-950/50 border border-neutral-800/60 p-6 text-center text-xs text-neutral-500">
                      No test.sh script present
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB: KNOWLEDGE & REQUIREMENTS */}
            <TabsContent value="knowledge" className="pt-3 space-y-4">
              <div>
                <h5 className="text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-1.5">
                  <Zap size={13} className="text-yellow-400" />
                  Synthesized Task Requirements ({extractedData.synthesizedRequirements.length})
                </h5>
                <div className="space-y-2">
                  {extractedData.synthesizedRequirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/80 text-xs flex items-start gap-2.5"
                    >
                      <Badge variant="outline" className="shrink-0 text-[10px] uppercase font-mono">
                        {req.type}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-neutral-200">{req.content}</p>
                        <span className="text-[10px] text-neutral-500 mt-1 block">
                          Source: {req.sourceReference} • Priority: {req.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-cyan-400" />
                  Synthesized Knowledge Graph Nodes ({extractedData.synthesizedKnowledgeNodes.length})
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {extractedData.synthesizedKnowledgeNodes.map((kn, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-100">{kn.name}</span>
                        <Badge variant="outline" className="text-[9px] text-cyan-400 border-cyan-800">
                          {kn.type}
                        </Badge>
                      </div>
                      <p className="text-neutral-400 text-[11px] line-clamp-2">{kn.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB: ALL ARCHIVE FILES */}
            <TabsContent value="all-files" className="pt-3">
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 divide-y divide-neutral-900 max-h-[380px] overflow-y-auto">
                {extractedData.allFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <FileCode size={14} className="text-neutral-500" />
                      <span className="text-neutral-300">{file.filename}</span>
                    </div>
                    <div className="flex items-center gap-3 text-neutral-500">
                      <span>{file.mimeType}</span>
                      <span className="font-mono text-neutral-400">
                        {file.size < 1024
                          ? `${file.size} B`
                          : `${(file.size / 1024).toFixed(1)} KB`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              disabled={submitting || !title.trim()}
              onClick={handleSaveTaskPackage}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-medium px-5"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Ingesting Benchmark Task...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Create Task Package & Ingest
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
