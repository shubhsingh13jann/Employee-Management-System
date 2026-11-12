import React, { useState, useRef, useEffect } from "react";

export interface FloatingBatchActionBarProps {
  selectedCount: number;
  totalFilteredCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchStatusChange: (status: string) => void;
  onBatchExportCSV: () => void;
  onBatchArchive: () => void;
  onBatchDelete: () => void;
  isProcessing?: boolean;
}

export const FloatingBatchActionBar: React.FC<FloatingBatchActionBarProps> = ({
  selectedCount,
  totalFilteredCount,
  isAllSelected,
  onSelectAll,
  onDeselectAll,
  onBatchStatusChange,
  onBatchExportCSV,
  onBatchArchive,
  onBatchDelete,
  isProcessing = false,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    if (showStatusMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusMenu]);

  if (selectedCount === 0) return null;

  const statusOptions = [
    { key: "active", label: "Active", icon: "bi-play-circle-fill", color: "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20" },
    { key: "planning", label: "Planning", icon: "bi-calendar-check", color: "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20" },
    { key: "on_hold", label: "On Hold", icon: "bi-pause-circle", color: "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" },
    { key: "completed", label: "Completed", icon: "bi-check2-circle", color: "text-blue-400 bg-blue-500/10 hover:bg-blue-500/20" },
    { key: "archived", label: "Archived", icon: "bi-archive", color: "text-slate-400 bg-slate-500/10 hover:bg-slate-500/20" },
  ];

  return (
    <div
      className="fixed bottom-6 flex justify-center items-center z-50 pointer-events-none px-4"
      style={{ left: "240px", right: "0px" }}
    >
      <div className="flex items-center gap-2 sm:gap-3 bg-slate-900/95 backdrop-blur-md text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl border border-slate-700/80 shadow-slate-950/40 pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-200">
        {/* Selection Badge & Count */}
        <div className="flex items-center gap-2 border-r border-slate-700/80 pr-3 sm:pr-4">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xs font-bold">
            <i className="bi bi-check2"></i>
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-white tracking-wide">
              {selectedCount}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300 ml-1 hidden md:inline">
              selected
            </span>
          </div>

          {/* Select all or deselect */}
          {selectedCount < totalFilteredCount ? (
            <button
              type="button"
              onClick={onSelectAll}
              disabled={isProcessing}
              className="text-[10px] sm:text-[11px] text-indigo-300 hover:text-indigo-200 underline underline-offset-2 ml-1 cursor-pointer transition-colors"
            >
              Select all ({totalFilteredCount})
            </button>
          ) : (
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={isProcessing}
              className="text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2 ml-1 cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. Batch Status Transition Dropdown Trigger */}
          <div className="relative" ref={statusMenuRef}>
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-slate-100 border border-slate-600/80 text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Transition status for all selected initiatives"
            >
              <i className="bi bi-arrow-repeat text-indigo-400 text-xs"></i>
              <span className="hidden sm:inline">Batch Status</span>
              <span className="sm:hidden">Status</span>
              <i className={`bi bi-chevron-${showStatusMenu ? "up" : "down"} text-[9px] text-slate-400`}></i>
            </button>

            {/* Status Dropdown Menu */}
            {showStatusMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Transition Status To
                </div>
                {statusOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setShowStatusMenu(false);
                      onBatchStatusChange(opt.key);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${opt.color}`}
                  >
                    <i className={`bi ${opt.icon}`}></i>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Batch Export CSV */}
          <button
            type="button"
            onClick={onBatchExportCSV}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-slate-100 border border-slate-600/80 text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Export only selected initiatives to CSV"
          >
            <i className="bi bi-file-earmark-spreadsheet text-emerald-400 text-xs"></i>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          {/* 3. Batch Archive */}
          <button
            type="button"
            onClick={onBatchArchive}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-slate-100 border border-slate-600/80 text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Move selected initiatives to Archive"
          >
            <i className="bi bi-archive text-amber-400 text-xs"></i>
            <span className="hidden sm:inline">Archive</span>
          </button>

          {/* 4. Batch Delete */}
          <button
            type="button"
            onClick={onBatchDelete}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500/80 text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Permanently delete selected initiatives and associated records"
          >
            <i className="bi bi-trash3 text-xs"></i>
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {/* Clear selection X button */}
        <button
          type="button"
          onClick={onDeselectAll}
          disabled={isProcessing}
          className="ml-1 w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-xs"
          title="Dismiss selection"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  );
};
