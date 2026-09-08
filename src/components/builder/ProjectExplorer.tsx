"use client";

import React, { useState } from "react";
import {
  FileCode,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Terminal,
  Database,
  FileText,
} from "lucide-react";
import { ProjectFile } from "@/lib/types";

interface ProjectExplorerProps {
  files: ProjectFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onUpdateFileContent: (fileId: string, content: string) => void;
  onAddFile: (name: string, path: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDownloadAll: () => void;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onUpdateFileContent,
  onAddFile,
  onDeleteFile,
  onDownloadAll,
}) => {
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [copied, setCopied] = useState(false);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim();
    const path = cleanName.startsWith("src/") ? cleanName : `src/${cleanName}`;
    onAddFile(cleanName, path);
    setNewFileName("");
    setIsAddingFile(false);
  };

  const handleCopyCurrent = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".sql")) return <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    if (fileName.endsWith(".json")) return <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    if (fileName.endsWith(".md")) return <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    return <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  };

  return (
    <div className="flex h-full bg-[#101218] rounded-xl border border-[#232734] overflow-hidden text-xs">
      {/* Left Sidebar: Virtual File Tree */}
      <div className="w-56 border-r border-[#222738] bg-[#141622] flex flex-col justify-between shrink-0">
        <div className="p-3 border-b border-[#222738] flex items-center justify-between">
          <div className="font-semibold text-gray-200 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>Project Files</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingFile(true)}
            className="p-1 rounded hover:bg-[#252b3e] text-gray-400 hover:text-white transition-colors"
            title="Create new file"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* File Creation Input */}
        {isAddingFile && (
          <form onSubmit={handleCreateFile} className="p-2 border-b border-[#222738] bg-[#1a1d2d]">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. Card.jsx or schema.sql"
              className="w-full bg-[#101218] px-2 py-1 rounded text-xs text-white placeholder-gray-500 border border-cyan-500 focus:outline-none"
              autoFocus
            />
            <div className="flex items-center justify-end gap-1 mt-1.5">
              <button
                type="button"
                onClick={() => setIsAddingFile(false)}
                className="px-2 py-0.5 text-[10px] text-gray-400 hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-0.5 text-[10px] bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {files.map((file) => {
            const isSelected = file.id === activeFile?.id;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors group ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                    : "text-gray-400 hover:bg-[#1a1d2a] hover:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(file.name)}
                  <span className="truncate">{file.path}</span>
                </div>
                {files.length > 1 && file.id !== "main-app" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-opacity"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-[#222738] bg-[#12141e]">
          <button
            type="button"
            onClick={onDownloadAll}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#1e2334] hover:bg-[#282f46] text-gray-200 hover:text-white transition-colors border border-[#2b334a]"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download All Files</span>
          </button>
        </div>
      </div>

      {/* Right Area: Code Editor / Viewer */}
      <div className="flex-1 flex flex-col bg-[#0c0d12] overflow-hidden">
        {/* Editor Tab Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#222738] bg-[#13151f]">
          <div className="flex items-center gap-2">
            {activeFile && getFileIcon(activeFile.name)}
            <span className="font-mono text-white text-xs">{activeFile?.path}</span>
            <span className="text-[10px] text-gray-500 uppercase font-mono">
              ({activeFile?.content.length.toLocaleString() || 0} bytes)
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCurrent}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1c202e] hover:bg-[#262c3e] border border-[#293146] text-gray-300 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Textarea Editor */}
        <div className="flex-1 p-3 overflow-hidden">
          <textarea
            value={activeFile?.content || ""}
            onChange={(e) => {
              if (activeFile) {
                onUpdateFileContent(activeFile.id, e.target.value);
              }
            }}
            spellCheck={false}
            className="w-full h-full bg-transparent font-mono text-xs text-gray-200 resize-none focus:outline-none leading-relaxed selection:bg-cyan-500/30 selection:text-white"
          />
        </div>
      </div>
    </div>
  );
};
