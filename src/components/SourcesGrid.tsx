"use client";

import React, { useState } from "react";
import { ExternalLink, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { SearchResult } from "@/lib/types";

interface SourcesGridProps {
  sources: SearchResult[];
  activeCitation?: number | null;
  onSourceClick?: (source: SearchResult) => void;
}

export const SourcesGrid: React.FC<SourcesGridProps> = ({
  sources,
  activeCitation,
  onSourceClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const displaySources = expanded ? sources : sources.slice(0, 4);

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {displaySources.map((source) => {
          const isHighlighted = activeCitation === source.id;

          return (
            <a
              key={source.id}
              id={`source-${source.id}`}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              onClick={() => onSourceClick && onSourceClick(source)}
              title={source.snippet || source.title}
              className={`group flex flex-col justify-between p-2.5 rounded-xl border transition-all text-left relative overflow-hidden bg-[#202222]/80 hover:bg-[#252828] ${
                isHighlighted
                  ? "border-perplexity-teal ring-1 ring-perplexity-teal/50 bg-[#252929]"
                  : "border-[#2a2d2d] hover:border-[#383b3b]"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {source.favicon ? (
                      <img
                        src={source.favicon}
                        alt=""
                        className="w-3.5 h-3.5 rounded-sm shrink-0"
                        onError={(e) => {
                          // fallback
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    )}
                    <span className="text-[10px] text-gray-400 font-medium truncate">
                      {source.domain}
                    </span>
                  </div>
                  <span className="text-[10px] w-4 h-4 rounded-full bg-[#2b2d2d] text-gray-300 font-semibold flex items-center justify-center shrink-0">
                    {source.id}
                  </span>
                </div>

                <h4 className="text-xs font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-perplexity-teal transition-colors">
                  {source.title}
                </h4>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-gray-500 group-hover:text-gray-400">
                <span className="truncate max-w-[120px]">
                  {source.snippet ? source.snippet.slice(0, 45) + "..." : "View source"}
                </span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-perplexity-teal" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
