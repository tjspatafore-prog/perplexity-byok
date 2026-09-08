"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Sparkles,
  Share2,
  Printer,
  FileDown,
  ArrowRight,
  Globe,
  ExternalLink,
  BookOpen,
  Check,
} from "lucide-react";
import { SearchResult } from "@/lib/types";
import { SourcesGrid } from "@/components/SourcesGrid";
import { PdfViewerModal } from "@/components/PdfViewerModal";

interface SharedReportData {
  q: string; // query
  c: string; // markdown content
  s?: SearchResult[]; // sources
  m?: string; // model
  t?: number; // timestamp
}

export default function SharePage() {
  const [data, setData] = useState<SharedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [activePdfSource, setActivePdfSource] = useState<SearchResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (!hash || !hash.includes("r=")) {
        setError("No report data found in this link. Please request a new share link.");
        setLoading(false);
        return;
      }

      const raw = hash.split("r=")[1];
      if (!raw) {
        setError("Invalid report payload.");
        setLoading(false);
        return;
      }

      // Decode base64 UTF-8
      const jsonStr = decodeURIComponent(
        Array.prototype.map
          .call(atob(raw), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      const parsed: SharedReportData = JSON.parse(jsonStr);
      setData(parsed);
      setLoading(false);
    } catch (err: any) {
      console.error("Failed to parse shared report hash:", err);
      setError("Failed to decode this report. The link may have been truncated or corrupted.");
      setLoading(false);
    }
  }, []);

  const handleShareCurrentLink = async () => {
    if (typeof navigator !== "undefined" && navigator.share && data) {
      try {
        await navigator.share({
          title: data.q,
          url: window.location.href,
        });
        return;
      } catch (e) {}
    }
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121313] text-gray-200 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-perplexity-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading research report...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#121313] text-gray-200 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#1a1c1c] border border-[#2d3030] text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-white">Report Not Found</h2>
          <p className="text-xs text-gray-400">{error || "Could not load report."}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-perplexity-teal text-[#121313] font-semibold text-xs hover:bg-[#2fe4d8] transition-colors"
          >
            Go to ai-byok.online
          </a>
        </div>
      </div>
    );
  }

  const formattedDate = data.t
    ? new Date(data.t).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  return (
    <div className="min-h-screen bg-[#121313] text-gray-200 selection:bg-perplexity-teal/30 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#121313]/90 backdrop-blur border-b border-[#262828] no-print">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-perplexity-teal to-blue-500 flex items-center justify-center text-xs font-bold text-[#121313]">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-tight group-hover:text-perplexity-teal transition-colors">
                ai-byok.online
              </span>
              <span className="text-[10px] text-gray-400">Shared Research Report</span>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareCurrentLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202222] hover:bg-[#282a2a] border border-[#2d3030] text-xs text-gray-300 hover:text-white transition-colors"
              title="Share this report"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Link</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-perplexity-teal" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202222] hover:bg-[#282a2a] border border-[#2d3030] text-xs text-gray-300 hover:text-white transition-colors"
              title="Print or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <a
              href={`/?q=${encodeURIComponent(data.q)}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-perplexity-teal text-[#121313] font-semibold text-xs hover:bg-[#2fe4d8] transition-colors"
            >
              <span>Ask Follow-up</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Report Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Title Header */}
        <div className="space-y-3 pb-6 border-b border-[#262828]">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span className="px-2 py-0.5 rounded-full bg-[#202222] border border-[#2d3030] text-perplexity-teal font-medium">
              {data.m || "Multi-Source Research"}
            </span>
            <span>•</span>
            <span>Synthesized {formattedDate}</span>
            {data.s && data.s.length > 0 && (
              <>
                <span>•</span>
                <span>{data.s.length} verified web sources cited</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            {data.q}
          </h1>
        </div>

        {/* Sources Grid */}
        {data.s && data.s.length > 0 && (
          <div className="no-print">
            <SourcesGrid
              sources={data.s}
              activeCitation={activeCitation}
              onOpenPdf={(source) => setActivePdfSource(source)}
            />
          </div>
        )}

        {/* In-Browser PDF Reader Modal */}
        {activePdfSource && (
          <PdfViewerModal
            url={activePdfSource.url}
            title={activePdfSource.title}
            domain={activePdfSource.domain}
            onClose={() => setActivePdfSource(null)}
          />
        )}

        {/* Report Content Body */}
        <article className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-a:text-perplexity-teal prose-code:text-perplexity-teal prose-code:bg-[#1a1c1c] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#181a1a] prose-pre:border prose-pre:border-[#2d3030] leading-relaxed text-sm sm:text-base space-y-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-perplexity-teal hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  {children}
                  <ExternalLink className="w-3 h-3 inline-block opacity-70" />
                </a>
              ),
            }}
          >
            {data.c}
          </ReactMarkdown>
        </article>

        {/* Print-only Sources Section */}
        {data.s && data.s.length > 0 && (
          <div className="hidden print:block pt-8 border-t border-gray-400 text-xs space-y-2">
            <h3 className="font-bold text-black uppercase tracking-wider">Citations & References</h3>
            {data.s.map((src) => (
              <div key={src.id} className="text-gray-800">
                [{src.id}] <strong>{src.title}</strong> — {src.url} ({src.domain})
              </div>
            ))}
          </div>
        )}

        {/* Footer Call to Action */}
        <div className="no-print pt-8 border-t border-[#262828] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Generated on ai-byok.online • 100% Client-Side Privacy</span>
          </div>

          <a
            href="/"
            className="flex items-center gap-1.5 text-perplexity-teal hover:underline font-medium"
          >
            <span>Launch your own autonomous research agent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
}
