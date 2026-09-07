"use client";

import React, { useState } from "react";
import { Users, ChevronDown, ChevronUp, Bot, ShieldCheck, Sparkles, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SwarmAgentMessage } from "@/lib/types";

interface SwarmDialogueViewProps {
  dialogue?: SwarmAgentMessage[];
  isStreaming?: boolean;
}

export const SwarmDialogueView: React.FC<SwarmDialogueViewProps> = ({
  dialogue = [],
  isStreaming = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!dialogue || dialogue.length === 0) return null;

  const activeAgent = dialogue.find((a) => a.status === "streaming");

  return (
    <div className="mb-6 rounded-2xl bg-[#1d1f1f] border border-[#2d3030] overflow-hidden shadow-lg transition-all animate-fadeIn">
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 bg-[#222424]/80 hover:bg-[#262828] border-b border-[#2d3030] flex items-center justify-between transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                Multi-Agent Swarm Collaboration
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {dialogue.length} {dialogue.length === 1 ? "Agent" : "Agents"}
                </span>
              </span>
              {isStreaming && activeAgent && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {activeAgent.agentName} debating...
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              Cross-model peer review & debate between specialized models
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {isExpanded ? "Collapse debate" : "View debate"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expandable Agent Discussion Messages */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 divide-y divide-[#282a2a]/60">
          {dialogue.map((agent, idx) => {
            const isAgentActive = agent.status === "streaming";

            return (
              <div
                key={agent.agentId || idx}
                className={`pt-4 first:pt-0 space-y-2 transition-all ${
                  isAgentActive ? "opacity-100" : "opacity-90 hover:opacity-100"
                }`}
              >
                {/* Agent Identity Pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-tr ${
                        agent.avatarColor || "from-teal-500 to-emerald-500"
                      } flex items-center justify-center text-white text-[10px] font-bold shadow`}
                    >
                      {agent.role === "scout" ? "1" : agent.role === "critic" ? "2" : "3"}
                    </div>
                    <span className="text-xs font-semibold text-gray-200">
                      {agent.agentName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#161717] border border-[#2b2d2d] text-gray-400">
                      {agent.roleLabel}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                    {agent.provider}
                  </span>
                </div>

                {/* Agent Speech Bubble Content */}
                <div className="pl-8 text-xs text-gray-300 leading-relaxed bg-[#161717]/60 rounded-xl p-3 border border-[#272929] prose prose-invert prose-xs max-w-none">
                  {agent.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {agent.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-gray-500 italic flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-perplexity-teal animate-ping" />
                      Analyzing and preparing peer briefing...
                    </span>
                  )}
                  {isAgentActive && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-perplexity-teal animate-pulse align-middle" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
