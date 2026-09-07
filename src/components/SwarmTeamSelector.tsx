"use client";

import React, { useRef, useEffect } from "react";
import {
  Users,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  X,
  ChevronDown,
} from "lucide-react";
import { ApiKeys, AVAILABLE_MODELS, ModelOption, ProviderType } from "@/lib/types";

interface SwarmTeamSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  swarmRoster: string[];
  onUpdateRoster: (roster: string[]) => void;
  keys: ApiKeys;
  onOpenSettings: () => void;
}

const PRESETS = [
  {
    name: "Frontier Trio (Recommended)",
    roster: ["gemini-3.8-flash-high", "claude-sonnet-5", "gpt-5.6-sol"],
    desc: "Gemini (Scout) + Claude (Critic) + GPT (Synthesizer)",
  },
  {
    name: "Speed & Scale Trio",
    roster: ["gemini-3.8-flash-high", "grok-4.6", "qwen-3.8-max"],
    desc: "Rapid turnaround across Google, xAI & Alibaba",
  },
  {
    name: "Deep Reasoning Quad",
    roster: ["gemini-3.1-pro-high", "claude-opus-5", "gpt-6-astra", "kimi-k3"],
    desc: "Exhaustive multi-agent academic debate & synthesis",
  },
];

const ROLE_META = [
  {
    role: "Scout",
    title: "Agent 1: Research Scout",
    desc: "Gathers initial facts, explores perspectives & establishes baseline evidence",
    color: "from-cyan-500 to-blue-500",
  },
  {
    role: "Critic",
    title: "Agent 2: Critical Debater",
    desc: "Cross-examines Agent 1, challenges assumptions & identifies overlooked nuances",
    color: "from-amber-500 to-rose-500",
  },
  {
    role: "Synthesizer",
    title: "Agent 3: Lead Synthesizer",
    desc: "Reconciles debate, weighs arguments & drafts definitive consensus answer",
    color: "from-purple-500 to-indigo-500",
  },
  {
    role: "Specialist",
    title: "Agent 4: Domain Specialist",
    desc: "Provides auxiliary domain verification or specialized fact-checking",
    color: "from-emerald-500 to-teal-500",
  },
];

export const SwarmTeamSelector: React.FC<SwarmTeamSelectorProps> = ({
  isOpen,
  onClose,
  swarmRoster,
  onUpdateRoster,
  keys,
  onOpenSettings,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRoster =
    swarmRoster && swarmRoster.length >= 2
      ? swarmRoster
      : ["gemini-3.8-flash-high", "claude-sonnet-5", "gpt-5.6-sol"];

  const handleToggleModel = (modelId: string) => {
    if (currentRoster.includes(modelId)) {
      if (currentRoster.length <= 2) {
        alert("A Swarm team requires at least 2 AI agents for collaborative debate.");
        return;
      }
      onUpdateRoster(currentRoster.filter((id) => id !== modelId));
    } else {
      if (currentRoster.length >= 4) {
        alert("A Swarm team supports up to 4 AI agents to balance debate depth and latency.");
        return;
      }
      onUpdateRoster([...currentRoster, modelId]);
    }
  };

  const handleSlotChange = (index: number, newModelId: string) => {
    const updated = [...currentRoster];
    updated[index] = newModelId;
    onUpdateRoster(updated);
  };

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full mb-3 left-0 sm:left-auto right-0 sm:right-auto z-50 w-full sm:w-[480px] bg-[#191a1a] border border-[#2e3030] rounded-2xl shadow-2xl overflow-hidden p-4 space-y-4 animate-fadeIn text-xs text-gray-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between pb-2 border-b border-[#292b2b]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-1.5">
              Swarm Team Roster
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                {currentRoster.length} Agents
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Pick 2 to 4 AI models to debate and co-author answers
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#252828] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Presets */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Quick Presets
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {PRESETS.map((preset, idx) => {
            const isMatch =
              currentRoster.length === preset.roster.length &&
              preset.roster.every((m, i) => currentRoster[i] === m);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onUpdateRoster(preset.roster)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  isMatch
                    ? "bg-purple-500/20 border-purple-500/50 text-white"
                    : "bg-[#202222] border-[#292b2b] text-gray-300 hover:bg-[#262828] hover:border-[#383a3a]"
                }`}
              >
                <div className="font-medium text-[11px] truncate flex items-center justify-between">
                  {preset.name.split(" ")[0]}
                  {isMatch && <Check className="w-3 h-3 text-purple-400" />}
                </div>
                <div className="text-[9px] text-gray-400 truncate mt-0.5">
                  {preset.roster.length} models
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Team Slots */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center justify-between">
          <span>Assigned Team Roles</span>
          <button
            type="button"
            onClick={() =>
              onUpdateRoster([
                "gemini-3.8-flash-high",
                "claude-sonnet-5",
                "gpt-5.6-sol",
              ])
            }
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors lowercase"
          >
            <RotateCcw className="w-2.5 h-2.5" /> reset trio
          </button>
        </span>

        <div className="space-y-1.5">
          {currentRoster.map((modelId, idx) => {
            const meta = ROLE_META[idx] || ROLE_META[ROLE_META.length - 1];
            const selectedModel = AVAILABLE_MODELS.find((m) => m.id === modelId);
            const hasKey = selectedModel
              ? Boolean(keys[selectedModel.provider as keyof ApiKeys])
              : false;

            return (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-xl bg-[#202222] border border-[#292b2b]"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-gradient-to-tr ${meta.color} flex items-center justify-center text-[10px] text-white font-bold shrink-0`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-gray-300">
                      {meta.title}
                    </span>
                    {!hasKey && (
                      <button
                        type="button"
                        onClick={onOpenSettings}
                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" /> Key needed
                      </button>
                    )}
                  </div>

                  <select
                    value={modelId}
                    onChange={(e) => handleSlotChange(idx, e.target.value)}
                    className="w-full bg-[#161717] border border-[#2e3030] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {AVAILABLE_MODELS.map((m) => {
                      const isKeyReady = Boolean(keys[m.provider as keyof ApiKeys]);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.provider.toUpperCase()}) - {m.pricing} {isKeyReady ? "✓" : "(No Key)"}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {currentRoster.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleToggleModel(modelId)}
                    className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                    title="Remove agent from team"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {currentRoster.length < 4 && (
            <button
              type="button"
              onClick={() => {
                const nextModel = AVAILABLE_MODELS.find((m) => !currentRoster.includes(m.id));
                if (nextModel) {
                  onUpdateRoster([...currentRoster, nextModel.id]);
                }
              }}
              className="w-full py-1.5 rounded-xl border border-dashed border-[#333636] hover:border-purple-400/60 hover:bg-purple-500/10 text-gray-400 hover:text-purple-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              + Add 4th Agent (Specialist)
            </button>
          )}
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-2 border-t border-[#262828] flex items-center justify-between text-[11px] text-gray-500">
        <span>Team active during Swarm queries</span>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-purple-400 hover:underline"
        >
          Manage All Keys →
        </button>
      </div>
    </div>
  );
};
