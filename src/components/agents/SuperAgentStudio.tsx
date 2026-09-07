"use client";

import React, { useState } from "react";
import {
  Bot,
  Plus,
  Sparkles,
  Zap,
  Code2,
  Cpu,
  Edit3,
  Trash2,
  Check,
  ArrowRight,
  Shield,
  Layers,
  Users,
} from "lucide-react";
import {
  SuperAgent,
  BUILTIN_SUPER_AGENTS,
  AVAILABLE_MODELS,
  ProviderType,
} from "@/lib/types";

interface SuperAgentStudioProps {
  customAgents: SuperAgent[];
  onSaveCustomAgents: (agents: SuperAgent[]) => void;
  onLaunchBuilderWithAgent: (agentId: string) => void;
  onAddToSwarm: (modelId: string) => void;
}

const AVATAR_OPTIONS = ["⚡", "🎨", "📊", "🔬", "🚀", "🛡️", "🧠", "💼", "🛠️", "💎", "🤖", "🌐"];

const COLOR_OPTIONS = [
  { name: "Cyan", class: "from-cyan-500 to-blue-600" },
  { name: "Purple", class: "from-purple-500 to-pink-600" },
  { name: "Emerald", class: "from-emerald-500 to-teal-600" },
  { name: "Amber", class: "from-amber-500 to-orange-600" },
  { name: "Rose", class: "from-rose-500 to-red-600" },
  { name: "Indigo", class: "from-indigo-500 to-violet-600" },
];

export const SuperAgentStudio: React.FC<SuperAgentStudioProps> = ({
  customAgents,
  onSaveCustomAgents,
  onLaunchBuilderWithAgent,
  onAddToSwarm,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [avatar, setAvatar] = useState("🧠");
  const [color, setColor] = useState("from-cyan-500 to-blue-600");
  const [modelId, setModelId] = useState("claude-3-7-sonnet-latest");
  const [specialty, setSpecialty] = useState<SuperAgent["specialty"]>("coding");
  const [systemPrompt, setSystemPrompt] = useState("");

  const allAgents = [...BUILTIN_SUPER_AGENTS, ...customAgents];

  const handleOpenCreate = () => {
    setName("");
    setTagline("");
    setAvatar("🧠");
    setColor("from-cyan-500 to-blue-600");
    setModelId("claude-3-7-sonnet-latest");
    setSpecialty("coding");
    setSystemPrompt("");
    setEditingAgentId(null);
    setIsCreating(true);
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    const selectedModel = AVAILABLE_MODELS.find((m) => m.id === modelId);
    const provider: ProviderType = selectedModel?.provider || "anthropic";

    if (editingAgentId) {
      const updated = customAgents.map((ag) =>
        ag.id === editingAgentId
          ? {
              ...ag,
              name: name.trim(),
              tagline: tagline.trim() || "Autonomous Super Agent",
              avatar,
              color,
              modelId,
              provider,
              specialty,
              systemPrompt: systemPrompt.trim(),
            }
          : ag
      );
      onSaveCustomAgents(updated);
    } else {
      const newAgent: SuperAgent = {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        tagline: tagline.trim() || "Autonomous Super Agent",
        avatar,
        color,
        modelId,
        provider,
        specialty,
        systemPrompt: systemPrompt.trim(),
        isCustom: true,
      };
      onSaveCustomAgents([...customAgents, newAgent]);
    }

    setIsCreating(false);
  };

  const handleDeleteAgent = (agentId: string) => {
    if (confirm("Are you sure you want to delete this custom agent?")) {
      const updated = customAgents.filter((a) => a.id !== agentId);
      onSaveCustomAgents(updated);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252834] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Autonomous Multi-Model Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Super Agent Creator & Roster
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl">
            Design specialized AI agents with tailored system directives, assign them to your preferred LLMs (Claude, GPT-4o, Gemini, Qwen), and deploy them straight into the App Builder or Swarm Team.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Super Agent</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allAgents.map((agent) => {
          const modelDef = AVAILABLE_MODELS.find((m) => m.id === agent.modelId);
          return (
            <div
              key={agent.id}
              className="flex flex-col justify-between p-5 rounded-2xl bg-[#12141a] border border-[#232734] hover:border-[#353b4e] transition-all group"
            >
              <div className="space-y-3">
                {/* Agent Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${agent.color} flex items-center justify-center text-2xl shadow-md`}
                    >
                      {agent.avatar}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {agent.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1c202c] border border-[#2b3042] text-gray-400 font-medium capitalize">
                        {agent.specialty}
                      </span>
                    </div>
                  </div>

                  {agent.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAgent(agent.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors"
                      title="Delete Agent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tagline */}
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">
                  {agent.tagline}
                </p>

                {/* Model Badge */}
                <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-perplexity-teal shrink-0" />
                  <span className="truncate">
                    {modelDef?.name || agent.modelId} ({agent.provider})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-[#1e2230] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onAddToSwarm(agent.modelId)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1d28] hover:bg-[#232736] border border-[#292f42] text-[11px] text-purple-300 transition-colors"
                  title="Add this agent to your Multi-Agent Swarm Team"
                >
                  <Users className="w-3 h-3 text-purple-400" />
                  <span>Join Swarm</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLaunchBuilderWithAgent(agent.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-[11px] text-cyan-300 font-semibold transition-colors"
                >
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Launch in Studio</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Agent Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-[#141620] border border-[#282d3d] rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#252a3a] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span>Create New Super Agent</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-4 text-xs">
              {/* Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-medium">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cloud Architect, Crypto Trader"
                    className="w-full bg-[#1c202c] border border-[#2b3142] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-medium">Short Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Builds secure AWS/GCP infrastructures"
                    className="w-full bg-[#1c202c] border border-[#2b3142] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Avatar & Color Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-medium">Avatar Icon</label>
                  <div className="flex flex-wrap gap-1.5 bg-[#1c202c] p-2 rounded-xl border border-[#2b3142]">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setAvatar(av)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                          avatar === av ? "bg-cyan-500 text-white" : "hover:bg-[#2a3040]"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-medium">Color Gradient</label>
                  <div className="flex flex-wrap gap-1.5 bg-[#1c202c] p-2 rounded-xl border border-[#2b3142]">
                    {COLOR_OPTIONS.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => setColor(col.class)}
                        className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${col.class} border-2 ${
                          color === col.class ? "border-white" : "border-transparent"
                        }`}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Model & Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-300 font-medium">Assigned AI Model</label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full bg-[#1c202c] border border-[#2b3142] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300 font-medium">Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value as any)}
                    className="w-full bg-[#1c202c] border border-[#2b3142] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 capitalize"
                  >
                    <option value="coding">Coding & Web Apps</option>
                    <option value="design">UI/UX & Product Design</option>
                    <option value="analysis">Financial & Data Analysis</option>
                    <option value="research">Academic & Market Research</option>
                    <option value="growth">Growth & Copywriting</option>
                  </select>
                </div>
              </div>

              {/* System Prompt / Directive */}
              <div className="space-y-1">
                <label className="text-gray-300 font-medium">
                  Core Directives & System Prompt
                </label>
                <textarea
                  rows={5}
                  required
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Define your agent's persona, specialized knowledge, coding style, formatting constraints, and methodologies..."
                  className="w-full bg-[#1c202c] border border-[#2b3142] rounded-xl px-3 py-2 text-white placeholder-gray-500 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-[#202432] text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold transition-all shadow-md shadow-cyan-500/20"
                >
                  Save Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
