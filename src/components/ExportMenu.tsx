"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  FileDown,
  Printer,
  Share2,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { SearchResult } from "@/lib/types";

interface ExportMenuProps {
  query: string;
  content: string;
  sources?: SearchResult[];
  modelUsed?: string;
  createdAt?: number;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  query,
  content,
  sources = [],
  modelUsed = "AI",
  createdAt = Date.now(),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleExportPDF = () => {
    setIsOpen(false);
    // Trigger browser print dialog styled via @media print in globals.css
    window.print();
  };

  const handleDownloadMarkdown = () => {
    setIsOpen(false);
    const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const sourcesBlock =
      sources.length > 0
        ? `\n\n---\n\n## Sources & References\n${sources
            .map((s) => `[${s.id}] [${s.title}](${s.url}) — *${s.domain}*`)
            .join("\n")}`
        : "";

    const markdownDoc = `# ${query}\n\n*Generated on ${dateStr} via [ai-byok.online](https://ai-byok.online) using ${modelUsed}*\n\n---\n\n${content}${sourcesBlock}\n`;

    const blob = new Blob([markdownDoc], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = query.slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.setAttribute("download", `${safeTitle || "research_report"}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    const textToCopy = `# ${query}\n\n${content}\n\n*Read live on https://ai-byok.online*`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setIsOpen(false);
    }, 1800);
  };

  return (
    <div ref={menuRef} className="relative inline-block no-print">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#202222] hover:bg-[#282a2a] border border-[#2d3030] hover:border-[#3d4040] text-xs text-gray-300 hover:text-white transition-colors"
        title="Export or Share Report"
      >
        <Download className="w-3.5 h-3.5 text-perplexity-teal" />
        <span>Export</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-2 w-56 rounded-xl bg-[#191a1a] border border-[#2d3030] shadow-2xl p-1.5 z-50 animate-fadeIn text-xs space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#252727] mb-1">
            Export & Share
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-200 hover:text-white hover:bg-[#222424] transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-medium">Export to PDF</div>
              <div className="text-[10px] text-gray-400">Save clean printable document</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-200 hover:text-white hover:bg-[#222424] transition-colors"
          >
            <FileDown className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="font-medium">Download Markdown</div>
              <div className="text-[10px] text-gray-400">Export .md with citations</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCopyReport}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-200 hover:text-white hover:bg-[#222424] transition-colors"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Share2 className="w-4 h-4 text-purple-400 shrink-0" />
            )}
            <div>
              <div className="font-medium">{copiedLink ? "Copied to Clipboard!" : "Copy Report Text"}</div>
              <div className="text-[10px] text-gray-400">Full markdown & link</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
