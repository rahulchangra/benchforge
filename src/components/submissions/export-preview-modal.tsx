"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  Terminal,
  FileCode,
  Container,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  FileArchive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ExportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmExport: () => void;
  submission: {
    taskTitle: string;
    taskPrompt: string;
    testSh: string | null;
    testPatch: string | null;
    solutionPatch: string | null;
    dockerfile: string | null;
    language: string;
    category: string;
    repoUrl: string;
    commitHash: string;
    qualityScore: number | null;
  };
  exporting?: boolean;
}

interface FilePreview {
  name: string;
  icon: React.ElementType;
  content: string | null;
  size: number;
  required: boolean;
  valid: boolean;
}

export function ExportPreviewModal({
  open,
  onClose,
  onConfirmExport,
  submission,
  exporting = false,
}: ExportPreviewModalProps) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  // Build file list with validation
  const files: FilePreview[] = [
    {
      name: "task.md",
      icon: FileText,
      content: `# ${submission.taskTitle}\n\n**Repository:** ${submission.repoUrl}\n**Commit:** ${submission.commitHash}\n**Language:** ${submission.language}\n**Category:** ${submission.category}\n\n## Task Prompt\n\n${submission.taskPrompt}`,
      size: submission.taskPrompt?.length || 0,
      required: true,
      valid: !!submission.taskPrompt && submission.taskPrompt.length > 50,
    },
    {
      name: "test.sh",
      icon: Terminal,
      content: submission.testSh,
      size: submission.testSh?.length || 0,
      required: true,
      valid: !!submission.testSh && submission.testSh.length > 10,
    },
    {
      name: "test.patch",
      icon: FileCode,
      content: submission.testPatch,
      size: submission.testPatch?.length || 0,
      required: true,
      valid: !!submission.testPatch && submission.testPatch.includes("diff --git"),
    },
    {
      name: "solution.patch",
      icon: FileCode,
      content: submission.solutionPatch,
      size: submission.solutionPatch?.length || 0,
      required: true,
      valid: !!submission.solutionPatch && submission.solutionPatch.includes("diff --git"),
    },
    {
      name: "Dockerfile",
      icon: Container,
      content: submission.dockerfile,
      size: submission.dockerfile?.length || 0,
      required: false,
      valid: !submission.dockerfile || submission.dockerfile.includes("FROM"),
    },
  ];

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const requiredFiles = files.filter((f) => f.required);
  const validFiles = files.filter((f) => f.valid);
  const allRequiredValid = requiredFiles.every((f) => f.valid);
  const qualityPass = (submission.qualityScore ?? 0) >= 0.7;

  const canExport = allRequiredValid && qualityPass;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neutral-100">
            <FileArchive size={20} className="text-orange-500" />
            Export Preview
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quality Summary */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Files</div>
                <div className="text-lg font-bold text-neutral-100">
                  {validFiles.length}/{files.length}
                  <span className="text-sm text-neutral-500 ml-1">valid</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Total Size</div>
                <div className="text-lg font-bold text-neutral-100">
                  {formatBytes(totalSize)}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Quality Score</div>
                <div className="text-lg font-bold">
                  <span
                    className={
                      qualityPass ? "text-emerald-400" : "text-yellow-400"
                    }
                  >
                    {((submission.qualityScore ?? 0) * 100).toFixed(0)}%
                  </span>
                  {qualityPass ? (
                    <CheckCircle
                      size={14}
                      className="inline ml-2 text-emerald-400"
                    />
                  ) : (
                    <AlertTriangle
                      size={14}
                      className="inline ml-2 text-yellow-400"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Status */}
          {!canExport && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-yellow-500/20 bg-yellow-950/20 p-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-yellow-400">
                    Issues Detected
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-neutral-400">
                    {!allRequiredValid && (
                      <li>• Some required files are missing or invalid</li>
                    )}
                    {!qualityPass && (
                      <li>• Quality score below 70% threshold</li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* File List */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-neutral-300">
              Package Contents
            </div>
            {files.map((file) => {
              const Icon = file.icon;
              const isExpanded = expandedFile === file.name;

              return (
                <div
                  key={file.name}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedFile(isExpanded ? null : file.name)
                    }
                    className="w-full flex items-center justify-between p-3 hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown size={14} className="text-neutral-500" />
                      ) : (
                        <ChevronRight size={14} className="text-neutral-500" />
                      )}
                      <Icon size={14} className="text-neutral-400" />
                      <span className="text-sm font-mono text-neutral-200">
                        {file.name}
                      </span>
                      {file.required && (
                        <Badge variant="outline" className="text-[10px]">
                          required
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-600">
                        {formatBytes(file.size)}
                      </span>
                      {file.valid ? (
                        <CheckCircle size={14} className="text-emerald-400" />
                      ) : file.required ? (
                        <XCircle size={14} className="text-red-400" />
                      ) : (
                        <AlertTriangle size={14} className="text-yellow-400" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && file.content && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-neutral-800 overflow-hidden"
                      >
                        <div className="p-3 bg-neutral-900/50 max-h-60 overflow-y-auto">
                          <pre className="text-xs text-neutral-400 font-mono whitespace-pre-wrap">
                            {file.content.substring(0, 1000)}
                            {file.content.length > 1000 && "..."}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <Button variant="outline" onClick={onClose} disabled={exporting}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              {!canExport && (
                <span className="text-xs text-yellow-400 mr-2">
                  Fix issues to enable export
                </span>
              )}
              <Button
                onClick={onConfirmExport}
                disabled={!canExport || exporting}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
              >
                <Download size={14} />
                {exporting ? "Exporting..." : "Download ZIP"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
