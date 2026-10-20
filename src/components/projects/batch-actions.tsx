"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Trash2, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface BatchActionsBarProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchExport: () => Promise<void>;
  onBatchDelete?: () => Promise<void>;
  projectId: string;
}

export function BatchActionsBar({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBatchExport,
  onBatchDelete,
}: BatchActionsBarProps) {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast({ type: "error", title: "No submissions selected" });
      return;
    }
    setExporting(true);
    try {
      await onBatchExport();
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!onBatchDelete || selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} submission(s)? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    try {
      await onBatchDelete();
    } finally {
      setDeleting(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky top-16 z-40 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-lg">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={selectedIds.length === totalCount ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            {selectedIds.length === totalCount ? (
              <CheckSquare size={16} className="text-orange-500" />
            ) : (
              <Square size={16} />
            )}
            {selectedIds.length === totalCount ? "Deselect All" : "Select All"}
          </button>

          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
            {selectedIds.length} selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="gap-2"
          >
            <Download size={14} />
            {exporting ? "Exporting..." : `Export ${selectedIds.length}`}
          </Button>

          {onBatchDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={14} />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onDeselectAll}
            className="text-neutral-500 hover:text-neutral-300"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SelectableSubmissionCardProps {
  submission: {
    id: string;
    taskTitle: string;
    status: string;
    language: string;
    category: string;
    qualityScore: number | null;
    createdAt: string;
  };
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  children: React.ReactNode;
}

export function SelectableSubmissionCard({
  submission,
  isSelected,
  onToggleSelect,
  children,
}: SelectableSubmissionCardProps) {
  return (
    <div className="relative group">
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggleSelect(submission.id);
          }}
          className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-all ${
            isSelected
              ? "bg-orange-500 border-orange-500"
              : "border-neutral-600 bg-neutral-900 hover:border-orange-500"
          }`}
        >
          {isSelected && (
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Card Content */}
      <div className={`transition-all ${isSelected ? "ring-2 ring-orange-500" : ""}`}>
        {children}
      </div>
    </div>
  );
}
