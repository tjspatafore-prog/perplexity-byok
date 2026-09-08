"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Globe,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import { SearchResult } from "@/lib/types";

export const isPdfUrl = (url: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".pdf") ||
    lower.includes(".pdf?") ||
    lower.includes(".pdf#") ||
    lower.includes("/pdf/") ||
    lower.includes("arxiv.org/abs/") ||
    lower.includes("arxiv.org/pdf/") ||
    lower.includes("biorxiv.org/content/") ||
    lower.includes("ncbi.nlm.nih.gov/pmc/articles/")
  );
};

interface SourcesGridProps {
  sources: SearchResult[];
  activeCitation?: number | null;
  onSourceClick?: (source: SearchResult) => void;
  onOpenPdf?: (source: SearchResult) => void;
}

export const SourcesGrid: React.FC<SourcesGridProps> = ({
  sources,
  activeCitation,
  onSourceClick,
  onOpenPdf,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!sources || sources.length === 0) return null;

  const displaySources = expanded ? sources : sources.slice(0, 4);

  const handleCopy = (e: React.MouseEvent, source: SearchResult) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(source.url);
    setCopiedId(source.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShare = async (e: React.MouseEvent, source: SearchResult) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: source.title,
          text: `Found via ai-byok.online: ${source.title}`,
          url: source.url,
        });
        return;
      } catch (err) {
        // User cancelled or not supported
      }
    }
    // Fallback to copy
    navigator.clipboard.writeText(source.url);
    setCopiedId(source.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePdfClick = (e: React.MouseEvent, source: SearchResult) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenPdf) {
      onOpenPdf(source);
    } else {
      window.open(source.url, "_blank", "noreferrer");
    }
  };

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-300">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-perplexity-teal" />
          <span>Sources ({sources.length})</span>
        </div>
        {sources.length > 4 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-perplexity-teal hover:underline flex items-center gap-1 text-xs font-normal"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                View all {sources.length} <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {displaySources.map((source) => {
          const isHighlighted = activeCitation === source.id;
          const isPdf = isPdfUrl(source.url);
          const isCopied = copiedId === source.id;

          return (
            <div
              key={source.id}
              id={`source-${source.id}`}
              onClick={() => {
                if (onSourceClick) onSourceClick(source);
                window.open(source.url, "_blank", "noreferrer");
              }}
              title={source.snippet || source.title}
              className={`group cursor-pointer flex flex-col justify-between p-2.5 rounded-xl border transition-all text-left relative overflow-hidden bg-[#202222]/80 hover:bg-[#252828] ${
                isHighlighted
                  ? "border-perplexity-teal ring-1 ring-perplexity-teal/50 bg-[#252929]"
                  : "border-[#2a2d2d] hover:border-[#383b3b]"
              }`}
            >
              <div className="space-y-1.5">
                {/* Source Top Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {source.favicon ? (
                      <img
                        src={source.favicon}
                        alt=""
                        className="w-3.5 h-3.5 rounded-sm shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    )}
                    <span className="text-[10px] text-gray-400 font-medium truncate max-w-[100px]">
                      {source.domain}
                    </span>
                    {isPdf && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 border border-red-500/40 text-red-400 shrink-0 uppercase tracking-wider">
                        PDF
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] w-4 h-4 rounded-full bg-[#2b2d2d] text-gray-300 font-semibold flex items-center justify-center shrink-0">
                    {source.id}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-xs font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-perplexity-teal transition-colors">
                  {source.title}
                </h4>
              </div>

              {/* Action Toolbar & Snippet */}
              <div className="pt-2.5 mt-1 border-t border-[#292b2b] flex items-center justify-between text-[10px] text-gray-500">
                {/* Direct Action Buttons */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {isPdf && (
                    <button
                      type="button"
                      onClick={(e) => handlePdfClick(e, source)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 transition-colors"
                      title="Read PDF in-app"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      <span>Read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleCopy(e, source)}
                    className="p-1 rounded hover:bg-[#2e3131] hover:text-gray-300 transition-colors"
                    title="Copy Source Link"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleShare(e, source)}
                    className="p-1 rounded hover:bg-[#2e3131] hover:text-gray-300 transition-colors"
                    title="Share Link"
                  >
                    <Share2 className="w-3 h-3 text-gray-400 hover:text-purple-400" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-gray-400 group-hover:text-perplexity-teal">
                  <span className="hidden sm:inline">Visit</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
