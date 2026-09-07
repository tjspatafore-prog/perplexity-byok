"use client";

import React, { useState } from "react";
import { Copy, Check, Download, FileCode, CheckCircle2 } from "lucide-react";

interface CodeViewerProps {
  code: string;
  filename?: string;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  filename = "App.jsx",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isHtml = code.trim().toLowerCase().startsWith("<!doctype") || code.trim().toLowerCase().startsWith("<html");
    const downloadName = isHtml ? "index.html" : filename;
    const blob = new Blob([code], { type: isHtml ? "text/html" : "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = code.split("\n");
  const sizeKb = (new Blob([code]).size / 1024).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-[#101218] rounded-xl border border-[#232732] overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#181a22] border-b border-[#232732] text-xs">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-medium text-gray-200">{filename}</span>
          <span className="text-[11px] text-gray-500 font-mono">
            {lines.length} lines • {sizeKb} KB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#222632] hover:bg-[#2c3242] border border-[#2c3242] text-gray-200 hover:text-white transition-colors text-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-medium transition-colors text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Monospace Canvas */}
      <div className="flex-1 overflow-auto p-4 font-mono text-xs text-gray-300 leading-relaxed select-text">
        <div className="table w-full">
          {lines.map((line, idx) => (
            <div key={idx} className="table-row hover:bg-white/[0.02]">
              <span className="table-cell pr-4 text-right select-none text-gray-600 w-10">
                {idx + 1}
              </span>
              <span className="table-cell whitespace-pre font-mono text-gray-200">
                {line || " "}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
