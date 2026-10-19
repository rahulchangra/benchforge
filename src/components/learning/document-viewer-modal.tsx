"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, FileCode, Layers, Container, Terminal, FileText } from "lucide-react";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    extractedText?: string | null;
  } | null;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
}: DocumentViewerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!document) return null;

  const content = document.extractedText || "No preview text available for this file.";
  const isDiff =
    document.originalName.endsWith(".patch") ||
    document.originalName.endsWith(".diff") ||
    document.mimeType.includes("diff");
  const isDocker =
    document.originalName.toLowerCase().includes("dockerfile") ||
    document.mimeType.includes("dockerfile");
  const isShell =
    document.originalName.endsWith(".sh") || document.mimeType.includes("sh");

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderIcon = () => {
    if (isDiff) return <Layers className="text-emerald-400" size={18} />;
    if (isDocker) return <Container className="text-amber-400" size={18} />;
    if (isShell) return <Terminal className="text-blue-400" size={18} />;
    return <FileText className="text-neutral-400" size={18} />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-neutral-950 border border-neutral-800 text-neutral-100 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-4 border-b border-neutral-800 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800">
              {renderIcon()}
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <span>{document.originalName}</span>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {document.mimeType}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400 mt-0.5">
                {(document.size / 1024).toFixed(1)} KB • Extracted Benchmark Document
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 border-neutral-800 hover:border-neutral-700 bg-neutral-900"
              onClick={handleCopy}
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 bg-neutral-950 font-mono text-xs select-text">
          {isDiff ? (
            <div className="space-y-0.5">
              {content.split(/\r?\n/).map((line, idx) => {
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
                    <span className="w-10 shrink-0 text-neutral-600 select-none text-right pr-3">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre">{line}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <pre className="text-neutral-300 whitespace-pre-wrap leading-relaxed font-mono">
              {content}
            </pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
