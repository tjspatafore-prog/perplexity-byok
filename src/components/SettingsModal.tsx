"use client";

import React, { useState } from "react";
import {
  X,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  Volume2,
  Trash2,
  ExternalLink,
  Shield,
  Cpu,
  RotateCcw,
  Users,
} from "lucide-react";
import { ApiKeys, AppSettings, AVAILABLE_MODELS } from "@/lib/types";
import { exportUserData, importUserData } from "@/lib/storage";
import { sanitizeApiKey } from "@/lib/providers";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => void;
}

const PROVIDERS = [
  {
    id: "google" as keyof ApiKeys,
    name: "Google Gemini",
    models: "Gemini 3.8 Flash ($0.75/$3.75), Gemini 3.1 Pro ($2.00/$12.00)",
    placeholder: "AIzaSy...",
    helpUrl: "https://aistudio.google.com/app/apikey",
    badge: "Free tier available",
  },
  {
    id: "anthropic" as keyof ApiKeys,
    name: "Anthropic Claude",
    models: "Claude Sonnet 5 ($3/$15), Claude Opus 5 ($5/$25), Claude Fable 5.1 ($10/$50)",
    placeholder: "sk-ant-api03-...",
    helpUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai" as keyof ApiKeys,
    name: "OpenAI",
    models: "GPT-5.6 Sol ($5/$30), GPT-5.6 Terra ($2.50/$15), GPT-6 Astra ($10/$50)",
    placeholder: "sk-proj-...",
    helpUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "grok" as keyof ApiKeys,
    name: "xAI (Grok)",
    models: "Grok 4.6 ($2.00 in / $6.00 out)",
    placeholder: "xai-...",
    helpUrl: "https://console.x.ai/",
  },
  {
    id: "kimi" as keyof ApiKeys,
    name: "Moonshot AI (Kimi)",
    models: "Kimi K3 ($3.00 in / $15.00 out), Kimi K2 ($1.50 in / $7.50 out)",
    placeholder: "sk-...",
    helpUrl: "https://platform.moonshot.ai/",
    altHelpUrl: "https://platform.moonshot.cn/",
  },
  {
    id: "qwen" as keyof ApiKeys,
    name: "Alibaba Cloud (Qwen / DashScope)",
    models: "Qwen 3.8 Max ($2.00 in / $6.00 out), 3.7 Plus ($0.40 in / $1.60 out)",
    placeholder: "sk-...",
    helpUrl: "https://modelstudio.console.alibabacloud.com/",
    altHelpUrl: "https://dashscope.console.aliyun.com/",
  },
  {
    id: "deepgram" as keyof ApiKeys,
    name: "Deepgram (Voice STT & TTS)",
    models: "Nova-2 (Dictation) + Brooke's Voice (flux-brooke-en)",
    placeholder: "Token / API Key...",
    helpUrl: "https://console.deepgram.com/",
    badge: "Voice & Audio",
  },
];

const DEEPGRAM_VOICES = [
  {
    id: "flux-brooke-en",
    name: "Brooke (flux-brooke-en) - Ultra-Natural Conversational (Recommended)",
  },
  { id: "aura-asteria-en", name: "Asteria (Female - Natural, Warm)" },
  { id: "aura-luna-en", name: "Luna (Female - Clear, Professional)" },
  { id: "aura-stella-en", name: "Stella (Female - Expressive)" },
  { id: "aura-athena-en", name: "Athena (Female - Authoritative)" },
  { id: "aura-hera-en", name: "Hera (Female - Direct)" },
  { id: "aura-orion-en", name: "Orion (Male - Calm, Deep)" },
  { id: "aura-arcas-en", name: "Arcas (Male - Energetic, Clear)" },
  { id: "aura-perseus-en", name: "Perseus (Male - Smooth)" },
  { id: "aura-angus-en", name: "Angus (Male - Friendly Irish accent)" },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [keys, setKeys] = useState<ApiKeys>(settings.keys || {});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [deepgramVoice, setDeepgramVoice] = useState(settings.deepgramVoice || "flux-brooke-en");
  const [autoSpeak, setAutoSpeak] = useState(settings.autoSpeak || false);
  const [modelAliases, setModelAliases] = useState<Record<string, string>>(
    settings.modelAliases || {}
  );
  const [swarmRoster, setSwarmRoster] = useState<string[]>(
    settings.swarmRoster || ["gemini-3.8-flash-high", "claude-sonnet-5", "gpt-5.6-sol"]
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"keys" | "models" | "swarm" | "voice" | "data">("keys");

  if (!isOpen) return null;

  const handleKeyChange = (provider: keyof ApiKeys, val: string) => {
    setKeys((prev) => ({
      ...prev,
      [provider]: sanitizeApiKey(val),
    }));
  };

  const toggleShowKey = (id: string) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    onSaveSettings({
      keys,
      deepgramVoice,
      autoSpeak,
      modelAliases,
      swarmRoster,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleExport = () => {
    const jsonStr = exportUserData();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-search-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importUserData(content)) {
        alert("Configuration and history imported successfully! Refreshing...");
        window.location.reload();
      } else {
        alert("Failed to import configuration. Invalid JSON file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all stored API keys from your browser?")) {
      setKeys({});
      onSaveSettings({ keys: {} });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#191a1a] border border-[#2e3030] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2c2c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-perplexity-teal/10 text-perplexity-teal border border-perplexity-teal/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Settings & API Keys</h2>
              <p className="text-xs text-gray-400">Bring Your Own Key (BYOK) - Stored securely on your device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252727] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-[#262828] flex gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("keys")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "keys"
                ? "border-perplexity-teal text-white font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Model API Keys ({Object.values(keys).filter(Boolean).length}/7 configured)
          </button>
          <button
            onClick={() => setActiveTab("models")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "models"
                ? "border-perplexity-teal text-white font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Model API IDs
          </button>
          <button
            onClick={() => setActiveTab("swarm")}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "swarm"
                ? "border-purple-400 text-white font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-400" />
            Swarm Team
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "voice"
                ? "border-perplexity-teal text-white font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Deepgram Voice & Audio
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === "data"
                ? "border-perplexity-teal text-white font-semibold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Backup & Data
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "keys" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#202222] border border-[#2d3030] text-xs text-gray-300 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-perplexity-teal shrink-0 mt-0.5" />
                <span>
                  Your API keys are stored in your browser's <code className="text-perplexity-teal">localStorage</code> and transmitted directly to the API providers. They are never sent to third-party databases.
                </span>
              </div>

              <div className="space-y-3.5">
                {PROVIDERS.map((p) => {
                  const val = keys[p.id] || "";
                  const isVisible = Boolean(showKey[p.id]);
                  const isConfigured = Boolean(val.length > 5);

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-[#202222]/80 border border-[#2a2c2c] hover:border-[#353838] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{p.name}</span>
                          {p.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {p.badge}
                            </span>
                          )}
                          {isConfigured && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Ready
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={p.helpUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-perplexity-teal hover:underline flex items-center gap-1"
                          >
                            Get key {p.altHelpUrl ? "(Global)" : ""} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          {p.altHelpUrl && (
                            <a
                              href={p.altHelpUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-gray-400 hover:text-perplexity-teal hover:underline flex items-center gap-1"
                            >
                              (China) <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-2">{p.models}</p>

                      <div className="relative flex items-center">
                        <input
                          type={isVisible ? "text" : "password"}
                          value={val}
                          onChange={(e) => handleKeyChange(p.id, e.target.value)}
                          placeholder={p.placeholder}
                          className="w-full bg-[#161717] border border-[#2e3030] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-perplexity-teal transition-colors pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowKey(p.id)}
                          className="absolute right-2.5 text-gray-500 hover:text-gray-300"
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "models" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#202222] border border-[#2d3030] text-xs text-gray-300 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Cpu className="w-4 h-4 text-perplexity-teal shrink-0 mt-0.5" />
                  <span>
                    Customize the exact model identifier string passed to each provider's API. If your API key requires a specific versioned slug (e.g. <code className="text-perplexity-teal">claude-sonnet-4.8</code>, <code className="text-perplexity-teal">gemini-3.8-flash</code>, etc.), you can edit it directly here.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setModelAliases({})}
                  className="shrink-0 flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
                  title="Reset all model IDs to defaults"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="space-y-2.5">
                {AVAILABLE_MODELS.map((model) => {
                  const currentValue =
                    modelAliases[model.id] !== undefined
                      ? modelAliases[model.id]
                      : model.apiModelName || model.id;

                  return (
                    <div
                      key={model.id}
                      className="p-3 rounded-xl bg-[#202222]/80 border border-[#2a2c2c] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-white">{model.name}</span>
                          <span className="text-[10px] text-gray-400 capitalize px-1.5 py-0.2 rounded bg-[#161717] border border-[#282a2a]">
                            {model.provider}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">
                            {model.pricing}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{model.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-gray-500 font-mono">API ID:</span>
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) =>
                            setModelAliases((prev) => ({
                              ...prev,
                              [model.id]: e.target.value.trim(),
                            }))
                          }
                          placeholder={model.apiModelName || model.id}
                          className="bg-[#161717] border border-[#2e3030] rounded-lg px-2.5 py-1.5 text-xs text-perplexity-teal font-mono w-44 sm:w-56 focus:outline-none focus:border-perplexity-teal"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "swarm" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#202222] border border-[#2d3030] text-xs text-gray-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Collaborative Multi-Agent Swarm Team</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSwarmRoster([
                        "gemini-3.8-flash-high",
                        "claude-sonnet-5",
                        "gpt-5.6-sol",
                      ])
                    }
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
                    title="Reset to recommended trio"
                  >
                    <RotateCcw className="w-3 h-3" /> Default Trio
                  </button>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  When you ask a question in <strong>Swarm</strong> mode, multiple AI models work together. Agent 1 gathers and analyzes evidence, Agent 2 cross-examines and debates findings, and Agent 3 reconciles the dialogue into a definitive cited answer.
                </p>
              </div>

              <div className="space-y-3">
                {/* Agent 1 */}
                <div className="p-3.5 rounded-xl bg-[#202222]/80 border border-[#2a2c2c] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                        1
                      </div>
                      <span className="text-xs font-semibold text-white">
                        Agent 1: Research Scout
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      Initial Evidence & Fact Gathering
                    </span>
                  </div>
                  <select
                    value={swarmRoster[0] || "gemini-3.8-flash-high"}
                    onChange={(e) => {
                      const updated = [...swarmRoster];
                      updated[0] = e.target.value;
                      setSwarmRoster(updated);
                    }}
                    className="w-full bg-[#161717] border border-[#2e3030] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider.toUpperCase()}) — {m.pricing}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agent 2 */}
                <div className="p-3.5 rounded-xl bg-[#202222]/80 border border-[#2a2c2c] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-[10px] text-white font-bold">
                        2
                      </div>
                      <span className="text-xs font-semibold text-white">
                        Agent 2: Peer Reviewer & Critic
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      Cross-Examination & Nuanced Debate
                    </span>
                  </div>
                  <select
                    value={swarmRoster[1] || "claude-sonnet-5"}
                    onChange={(e) => {
                      const updated = [...swarmRoster];
                      updated[1] = e.target.value;
                      setSwarmRoster(updated);
                    }}
                    className="w-full bg-[#161717] border border-[#2e3030] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider.toUpperCase()}) — {m.pricing}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agent 3 */}
                <div className="p-3.5 rounded-xl bg-[#202222]/80 border border-[#2a2c2c] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-[10px] text-white font-bold">
                        3
                      </div>
                      <span className="text-xs font-semibold text-white">
                        Agent 3: Master Synthesizer
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      Consensus Reconciliation & Grounded Citations
                    </span>
                  </div>
                  <select
                    value={swarmRoster[2] || "gpt-5.6-sol"}
                    onChange={(e) => {
                      const updated = [...swarmRoster];
                      updated[2] = e.target.value;
                      setSwarmRoster(updated);
                    }}
                    className="w-full bg-[#161717] border border-[#2e3030] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider.toUpperCase()}) — {m.pricing}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "voice" && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-[#202222] border border-[#2a2c2c] space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-perplexity-teal" />
                  <span className="text-xs font-semibold text-white">Deepgram Aura Voice Synthesis</span>
                </div>
                <p className="text-xs text-gray-400">
                  Select which realistic AI voice speaks your search summaries when you click "Listen".
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-300">Voice Persona</label>
                  <select
                    value={deepgramVoice}
                    onChange={(e) => setDeepgramVoice(e.target.value)}
                    className="w-full bg-[#161717] border border-[#2e3030] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-perplexity-teal"
                  >
                    {DEEPGRAM_VOICES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xs font-medium text-gray-200">Auto-speak Answers</span>
                    <p className="text-[11px] text-gray-400">Automatically read the answer aloud once completed</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="w-4 h-4 accent-perplexity-teal rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#202222] border border-[#2a2c2c] space-y-2">
                <span className="text-xs font-semibold text-white">Deepgram Nova-2 Voice Dictation</span>
                <p className="text-xs text-gray-400">
                  Voice input inside the search bar utilizes Deepgram Nova-2 with automatic punctuation, number formatting, and multi-language detection. Make sure your Deepgram key is entered in the Keys tab.
                </p>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#202222] border border-[#2a2c2c] space-y-3">
                <span className="text-xs font-semibold text-white">Export & Backup</span>
                <p className="text-xs text-gray-400">
                  Export all your configured keys, chat history, and preferences to a secure JSON file.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b2e2e] hover:bg-[#343737] text-white text-xs font-medium border border-[#353838] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Data (JSON)
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2b2e2e] hover:bg-[#343737] text-white text-xs font-medium border border-[#353838] cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Import Data
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/30 space-y-2">
                <span className="text-xs font-semibold text-red-300">Danger Zone</span>
                <p className="text-xs text-gray-400">
                  Clear all stored API keys from this browser. This cannot be undone.
                </p>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium border border-red-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete All Saved Keys
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#262828] bg-[#171818] flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {Object.values(keys).filter(Boolean).length} / 7 keys provided
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-[#252727] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-perplexity-teal hover:bg-perplexity-tealHover text-[#121313] transition-colors shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
