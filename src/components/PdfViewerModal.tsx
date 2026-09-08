"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";

interface PdfViewerModalProps {
  url: string;
  title?: string;
  domain?: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  url,
  title = "PDF Document",
  domain,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useFallbackViewer, setUseFallbackViewer] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Google Docs Viewer fallback for cross-origin PDF embedding if direct iframe is blocked
  const viewerUrl = useFallbackViewer
    ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
    : url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn">
      <div
        className={`bg-[#181a1a] border border-[#2e3131] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? "w-full h-full rounded-none"
            : "w-full max-w-5xl h-[90vh] sm:h-[85vh]"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2d2d] bg-[#1d1f1f]">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate" title={title}>
                {title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                {domain && <span className="font-medium text-perplexity-teal">{domain}</span>}
                <span>•</span>
                <span className="truncate max-w-[280px] sm:max-w-md text-gray-500">{url}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle fallback viewer if direct fails */}
            <button
              onClick={() => setUseFallbackViewer(!useFallbackViewer)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-300 hover:text-white bg-[#252828] hover:bg-[#2e3131] border border-[#333636] rounded-lg transition-colors"
              title="Toggle between Direct and Google Docs PDF viewer"
            >
              <RefreshCw className="w-3 h-3 text-perplexity-teal" />
              <span>{useFallbackViewer ? "Direct PDF" : "Google Viewer"}</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-300 hover:text-white bg-[#252828] hover:bg-[#2e3131] border border-[#333636] rounded-lg transition-colors"
              title="Copy PDF URL"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Link</span>
                </>
              )}
            </button>

            {/* Open in New Tab */}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-300 hover:text-white bg-[#252828] hover:bg-[#2e3131] border border-[#333636] rounded-lg transition-colors"
              title="Open original PDF in browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Open</span>
            </a>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-gray-400 hover:text-white bg-[#252828] hover:bg-[#2e3131] rounded-lg border border-[#333636] transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white bg-[#252828] hover:bg-red-500/20 hover:text-red-300 rounded-lg border border-[#333636] transition-colors ml-1"
              title="Close PDF Viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="relative flex-1 bg-[#121313] overflow-hidden">
          <iframe
            src={viewerUrl}
            title={title}
            className="w-full h-full border-0"
            allow="fullscreen"
          />

          {/* Fallback Banner for Iframe Restrictions */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#1b1d1d]/90 backdrop-blur border border-[#333636] px-3.5 py-1.5 rounded-full text-[11px] text-gray-400 flex items-center gap-2 shadow-lg pointer-events-auto">
            <span>Can&apos;t load the PDF preview?</span>
            <button
              onClick={() => setUseFallbackViewer(!useFallbackViewer)}
              className="text-perplexity-teal hover:underline font-medium"
            >
              Try {useFallbackViewer ? "Direct View" : "Google Proxy"}
            </button>
            <span>•</span>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Open in new tab <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
