"use client";

import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Search,
  Loader2,
  Share2,
  FileText,
} from "lucide-react";
import { Message, SearchResult } from "@/lib/types";
import { SourcesGrid } from "./SourcesGrid";
import { SwarmDialogueView } from "./SwarmDialogueView";
import { ExportMenu } from "./ExportMenu";
import { PdfViewerModal } from "./PdfViewerModal";

interface AnswerViewProps {
  message: Message;
  query?: string;
  deepgramKey?: string;
  deepgramVoice?: string;
  onFollowUpClick: (question: string) => void;
  isStreaming?: boolean;
}

export const AnswerView: React.FC<AnswerViewProps> = ({
  message,
  query,
  deepgramKey,
  deepgramVoice = "flux-brooke-en",
  onFollowUpClick,
  isStreaming = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [activePdfSource, setActivePdfSource] = useState<SearchResult | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCitationClick = (citationNum: number) => {
    setActiveCitation(citationNum);
    const element = document.getElementById(`source-${citationNum}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleToggleSpeak = async () => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!deepgramKey) {
      alert("Please configure your Deepgram API key in Settings to listen to answers.");
      return;
    }

    try {
      setAudioLoading(true);
      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-deepgram-key": deepgramKey,
        },
        body: JSON.stringify({
          text: message.content,
          voice: deepgramVoice,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate speech");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlayingAudio(true);
        setAudioLoading(false);
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        setAudioLoading(false);
      };

      await audio.play();
    } catch (err: any) {
      console.error("Speak error:", err);
      alert(err.message || "Failed to play audio with Deepgram");
      setAudioLoading(false);
      setIsPlayingAudio(false);
    }
  };

  // Strip "### Related" section from main markdown display
  const cleanedMarkdown = message.content.replace(/###\s*Related[\s\S]*$/i, "").trim();

  // Transform citations [1], [2] and document citations [Doc: filename] inside text node
  const renderTextWithCitations = (text: string) => {
    const parts = text.split(/(\[\d+\]|\[Doc:[^\]]+\]|\[Document:[^\]]+\])/gi);
    return parts.map((part, i) => {
      const matchNum = part.match(/^\[(\d+)\]$/);
      if (matchNum) {
        const num = parseInt(matchNum[1], 10);
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleCitationClick(num)}
            className="citation-badge"
            title={`Source [${num}]`}
          >
            {num}
          </button>
        );
      }

      const matchDoc = part.match(/^\[(?:Doc|Document):\s*(.+?)\]$/i);
      if (matchDoc) {
        const docName = matchDoc[1].trim();
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-medium align-baseline mx-0.5"
            title={`Referenced Document: ${docName}`}
          >
            <FileText className="w-2.5 h-2.5 inline" />
            {docName}
          </span>
        );
      }

      return part;
    });
  };

  return (
    <div className="space-y-6 pb-6 animate-fadeIn">
      {/* Search Steps Progress */}
      {message.searchSteps && message.searchSteps.length > 0 && (
        <div className="no-print p-3 rounded-xl bg-[#202222]/50 border border-[#272929] space-y-1.5 text-xs text-gray-400">
          {message.searchSteps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {step.status === "active" ? (
                <Loader2 className="w-3.5 h-3.5 text-perplexity-teal animate-spin" />
              ) : step.status === "completed" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Search className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span className={step.status === "active" ? "text-gray-200" : ""}>{step.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Documents Analyzed */}
      {message.attachedFiles && message.attachedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Analyzed Documents ({message.attachedFiles.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {message.attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#202222] border border-[#2c2f2f] text-xs"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/20 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-200 truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>{file.content?.length.toLocaleString() || 0} chars</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources Grid */}
      {message.sources && message.sources.length > 0 && (
        <SourcesGrid
          sources={message.sources}
          activeCitation={activeCitation}
          onOpenPdf={(source) => setActivePdfSource(source)}
        />
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

      {/* Multi-Agent Swarm Debate / Dialogue */}
      {message.swarmDialogue && message.swarmDialogue.length > 0 && (
        <SwarmDialogueView dialogue={message.swarmDialogue} isStreaming={isStreaming} />
      )}

      {/* Answer Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sparkles className="w-4 h-4 text-perplexity-teal" />
            <span>{message.focusMode === "swarm" ? "Synthesized Consensus" : "Answer"}</span>
            {message.focusMode === "swarm" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Swarm Team
              </span>
            )}
            {message.focusMode === "deep-research" && (
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Deep Research Whitepaper ({message.sources?.length || 30}+ sources)
              </span>
            )}
            {message.modelUsed && message.focusMode !== "swarm" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#202222] text-gray-400 border border-[#2e3030]">
                {message.modelUsed}
              </span>
            )}
          </div>
        </div>

        <div className="prose-perplexity text-sm text-gray-200 leading-relaxed font-normal">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p({ children }) {
                // Intercept text strings to attach citation pills
                const processed = React.Children.map(children, (child) => {
                  if (typeof child === "string") {
                    return renderTextWithCitations(child);
                  }
                  return child;
                });
                return <p className="mb-4">{processed}</p>;
              },
              li({ children }) {
                const processed = React.Children.map(children, (child) => {
                  if (typeof child === "string") {
                    return renderTextWithCitations(child);
                  }
                  return child;
                });
                return <li>{processed}</li>;
              },
              code({ className, children, ...props }) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {cleanedMarkdown}
          </ReactMarkdown>

          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-perplexity-teal animate-pulse align-middle" />
          )}
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="no-print pt-2 border-t border-[#262828] flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#202222] hover:text-white transition-colors"
            title="Copy answer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Deepgram Read Aloud */}
          <button
            onClick={handleToggleSpeak}
            disabled={audioLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
              isPlayingAudio
                ? "bg-perplexity-teal text-[#121313] font-semibold"
                : "hover:bg-[#202222] hover:text-white"
            }`}
            title="Listen with Deepgram Aura"
          >
            {audioLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating voice...</span>
              </>
            ) : isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop listening</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </>
            )}
          </button>

          {/* Export & Share Menu */}
          <ExportMenu
            query={query || cleanedMarkdown.slice(0, 60)}
            content={cleanedMarkdown}
            sources={message.sources}
            modelUsed={message.modelUsed}
            createdAt={message.createdAt}
          />
        </div>

        <div className="text-[11px] text-gray-500">
          Sources: {message.sources?.length || 0} web pages cited
          {message.attachedFiles && message.attachedFiles.length > 0 && ` • ${message.attachedFiles.length} doc${message.attachedFiles.length > 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Related Questions / Follow-ups */}
      {message.followUps && message.followUps.length > 0 && (
        <div className="no-print pt-4 space-y-2.5 border-t border-[#262828]">
          <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-perplexity-teal" /> Related Questions
          </span>
          <div className="flex flex-col gap-2">
            {message.followUps.map((fu, i) => (
              <button
                key={i}
                onClick={() => onFollowUpClick(fu)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#202222]/80 hover:bg-[#252828] border border-[#2a2d2d] hover:border-[#3a3d3d] text-xs text-gray-200 text-left transition-colors group"
              >
                <span className="group-hover:text-perplexity-teal transition-colors">{fu}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-perplexity-teal shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
