"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Play,
  History,
  Code2,
  Eye,
  Send,
  Loader2,
  Download,
  RotateCcw,
  Bot,
  Plus,
  ArrowRight,
  ChevronDown,
  Layers,
  Check,
  Zap,
} from "lucide-react";
import {
  AppProject,
  AppVersion,
  SuperAgent,
  ApiKeys,
  BUILTIN_SUPER_AGENTS,
  AVAILABLE_MODELS,
} from "@/lib/types";
import { BUILDER_STARTER_TEMPLATES } from "@/lib/builder/system-prompt";
import { SandboxPreview } from "./SandboxPreview";
import { CodeViewer } from "./CodeViewer";

interface AppBuilderViewProps {
  keys: ApiKeys;
  modelAliases?: Record<string, string>;
  customAgents?: SuperAgent[];
  onOpenSettings: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  versionNumber?: number;
  timestamp: number;
}

const STORAGE_KEY_BUILDER = "perplexity_byok_builder_projects";

// Sample initial code for immediate delightful preview
const DEFAULT_INITIAL_CODE = `function App() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Architect Multi-Model Agent Engine", tag: "Backend", priority: "High", done: true },
    { id: 2, title: "Design Base44 Split-Screen Sandbox", tag: "UI/UX", priority: "High", done: true },
    { id: 3, title: "Connect Live Google Drive Picker", tag: "Cloud", priority: "Medium", done: false },
    { id: 4, title: "Ship Autonomous App Studio v1.0", tag: "Launch", priority: "Urgent", done: false },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [filter, setFilter] = useState("all");

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTitle.trim(), tag: "Feature", priority: "Medium", done: false }]);
    setNewTitle("");
  };

  const filtered = tasks.filter(t => {
    if (filter === "active") return !t.done;
    if (filter === "completed") return t.done;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 p-6 sm:p-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-cyan-500/20">
              ⚡
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Autonomous Project Matrix</h1>
              <p className="text-xs text-gray-400">Live Base44 Sandbox • Edit me or prompt the AI on the left</p>
            </div>
          </div>
          <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
            {tasks.filter(t => t.done).length} / {tasks.length} Completed
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={addTask} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add new task or feature to live preview..."
            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-cyan-500/20"
          >
            Add Task
          </button>
        </form>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          {["all", "active", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={\`capitalize px-3 py-1.5 rounded-lg border transition-colors \${
                filter === f
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold"
                  : "bg-gray-900/60 text-gray-400 border-gray-800 hover:text-gray-200"
              }\`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={\`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer \${
                task.done
                  ? "bg-gray-900/30 border-gray-800/60 opacity-60"
                  : "bg-gray-900/80 hover:bg-gray-800/80 border-gray-800 hover:border-gray-700"
              }\`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-cyan-500 bg-gray-800 border-gray-700 focus:ring-0 cursor-pointer"
                />
                <span className={\`text-sm font-medium \${task.done ? "line-through text-gray-500" : "text-gray-100"}\`}>
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 border border-gray-700">
                  {task.tag}
                </span>
                <span className={\`text-[10px] px-2 py-0.5 rounded-md font-semibold \${
                  task.priority === "Urgent" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                  task.priority === "High" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                  "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                }\`}>
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`;

export const AppBuilderView: React.FC<AppBuilderViewProps> = ({
  keys,
  modelAliases = {},
  customAgents = [],
  onOpenSettings,
}) => {
  const allAgents = [...BUILTIN_SUPER_AGENTS, ...customAgents];

  // Active Project State
  const [projectTitle, setProjectTitle] = useState("Autonomous Task Matrix");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("full-stack-architect");
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-3-7-sonnet-latest");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  // Versions history
  const [versions, setVersions] = useState<AppVersion[]>([
    {
      id: "v1",
      versionNumber: 1,
      prompt: "Initial Matrix prototype",
      code: DEFAULT_INITIAL_CODE,
      language: "jsx",
      explanation: "Starter interactive project management application with real state and filtering.",
      timestamp: Date.now(),
    },
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      role: "assistant",
      content: "Welcome to the Base44 App & Website Builder Studio. What would you like to build or customize? Prompt me below, or choose a template to get started!",
      versionNumber: 1,
      timestamp: Date.now(),
    },
  ]);
  const [promptInput, setPromptInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingRawText, setStreamingRawText] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentVersion = versions[currentVersionIndex] || versions[versions.length - 1];

  // Helper to extract code from markdown block
  const extractCodeFromMarkdown = (text: string): { code: string; explanation: string } => {
    const codeBlockMatch = text.match(/```(?:jsx|tsx|html|javascript|js)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const code = codeBlockMatch[1].trim();
      const explanation = text.replace(/```(?:jsx|tsx|html|javascript|js)?\s*[\s\S]*?```/i, "").trim();
      return { code, explanation };
    }
    // Fallback: If streaming hasn't completed closing backticks
    const partialMatch = text.match(/```(?:jsx|tsx|html|javascript|js)?\s*([\s\S]*)$/i);
    if (partialMatch && partialMatch[1]) {
      return { code: partialMatch[1].trim(), explanation: "Generating application code..." };
    }
    return { code: text, explanation: "" };
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const userPrompt = (customPrompt || promptInput).trim();
    if (!userPrompt || isStreaming) return;

    // Check if key is configured for selected model
    const currentModelDef = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);
    if (currentModelDef) {
      const requiredKey = keys[currentModelDef.provider as keyof ApiKeys];
      if (!requiredKey) {
        onOpenSettings();
        alert(`Please configure your ${currentModelDef.provider.toUpperCase()} API key in Settings to build with ${currentModelDef.name}.`);
        return;
      }
    }

    setPromptInput("");
    setIsStreaming(true);
    setStreamingRawText("");

    const userMessageId = `u-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMessageId, role: "user", content: userPrompt, timestamp: Date.now() },
    ];
    setMessages(newMessages);

    try {
      const res = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          currentCode: currentVersion?.code || "",
          modelId: selectedModelId,
          keys,
          modelAliases,
          agentId: selectedAgentId,
          customAgents,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate code");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "delta") {
              accumulatedText += data.chunk;
              setStreamingRawText(accumulatedText);
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }

      // Generation completed
      const { code: newCode, explanation } = extractCodeFromMarkdown(accumulatedText);
      const newVersionNumber = versions.length + 1;
      const newVersion: AppVersion = {
        id: `v${newVersionNumber}`,
        versionNumber: newVersionNumber,
        prompt: userPrompt,
        code: newCode || currentVersion.code,
        language: "jsx",
        explanation: explanation || "Application updated with requested features.",
        timestamp: Date.now(),
      };

      const updatedVersions = [...versions, newVersion];
      setVersions(updatedVersions);
      setCurrentVersionIndex(updatedVersions.length - 1);

      setMessages([
        ...newMessages,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: explanation || "I have updated your application with the requested changes. Check out the live preview on the right!",
          versionNumber: newVersionNumber,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      console.error("Builder stream error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Generation Error: ${err.message || "Failed to generate response. Please check your API key."}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingRawText("");
    }
  };

  const handleFixError = (runtimeError: string) => {
    handleSendMessage(`Fix this runtime error occurring in the application:\n${runtimeError}\nEnsure all undefined variables, missing state hooks, or syntax issues are resolved.`);
  };

  // Determine current active code (live stream code or selected version code)
  const displayCode = isStreaming && streamingRawText
    ? extractCodeFromMarkdown(streamingRawText).code || currentVersion.code
    : currentVersion?.code || DEFAULT_INITIAL_CODE;

  const currentAgent = allAgents.find((a) => a.id === selectedAgentId) || allAgents[0];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-65px)] bg-[#0d0e12] overflow-hidden">
      {/* LEFT PANE: Studio Assistant Chat & Controls (40% width) */}
      <div className="w-full lg:w-[42%] flex flex-col h-full border-r border-[#222634] bg-[#12141a]">
        {/* Top Studio Bar */}
        <div className="p-3 border-b border-[#222634] space-y-2 bg-[#161922]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-white focus:outline-none hover:bg-white/5 px-1 py-0.5 rounded transition-colors"
                />
              </div>
            </div>

            {/* Version Selector */}
            <div className="flex items-center gap-1 bg-[#1c202c] px-2 py-1 rounded-lg border border-[#2b3042] text-xs">
              <History className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={currentVersionIndex}
                onChange={(e) => setCurrentVersionIndex(Number(e.target.value))}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs"
              >
                {versions.map((v, idx) => (
                  <option key={v.id} value={idx} className="bg-[#1c202c] text-gray-200">
                    v{v.versionNumber}: {v.prompt.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Super Agent & Model Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
            {/* Super Agent Selector */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1e2230] border border-[#2d3348] text-gray-300">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedAgentId}
                onChange={(e) => {
                  const ag = allAgents.find((a) => a.id === e.target.value);
                  setSelectedAgentId(e.target.value);
                  if (ag?.modelId) setSelectedModelId(ag.modelId);
                }}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer font-medium"
              >
                {allAgents.map((ag) => (
                  <option key={ag.id} value={ag.id} className="bg-[#1e2230] text-gray-200">
                    {ag.avatar} {ag.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selector */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#1e2230] border border-[#2d3348] text-gray-300">
              <Sparkles className="w-3.5 h-3.5 text-perplexity-teal" />
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#1e2230] text-gray-200">
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Chat Stream History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed animate-fadeIn ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 text-sm shadow-md">
                  {currentAgent.avatar || "⚡"}
                </div>
              )}

              <div
                className={`max-w-[85%] p-3.5 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/10"
                    : "bg-[#1a1d27] border border-[#272c3d] text-gray-200 space-y-2"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.versionNumber && (
                  <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-medium pt-1">
                    <Check className="w-3 h-3 text-cyan-400" />
                    <span>Updated Live Preview to Version {msg.versionNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming Feedback */}
          {isStreaming && (
            <div className="flex gap-3 text-xs leading-relaxed animate-fadeIn">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 text-sm animate-pulse">
                ⚡
              </div>
              <div className="p-3.5 rounded-2xl bg-[#1a1d27] border border-[#272c3d] text-gray-300 space-y-2 max-w-[85%]">
                <div className="flex items-center gap-2 text-cyan-300 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing code in real-time...</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono line-clamp-3 bg-[#101218] p-2 rounded-lg">
                  {streamingRawText.slice(-150) || "Initializing..."}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Starter Templates (if few messages) */}
        {messages.length <= 2 && (
          <div className="p-3 border-t border-[#222634] bg-[#141620]">
            <div className="text-[11px] text-gray-400 mb-2 font-medium">Prompt Starter Templates:</div>
            <div className="grid grid-cols-2 gap-2">
              {BUILDER_STARTER_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleSendMessage(tmpl.prompt)}
                  className="p-2 rounded-xl bg-[#1c202c] hover:bg-[#252b3b] border border-[#2a3042] text-left transition-colors group"
                >
                  <div className="font-semibold text-xs text-gray-200 group-hover:text-cyan-300 flex items-center justify-between">
                    <span>{tmpl.title}</span>
                    <ArrowRight className="w-3 h-3 text-gray-500 group-hover:text-cyan-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                    {tmpl.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input Box */}
        <div className="p-3 border-t border-[#222634] bg-[#161922]">
          <div className="relative flex items-center bg-[#101218] rounded-xl border border-[#262c3e] focus-within:border-cyan-500 transition-colors">
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Instruct ${currentAgent.name} (e.g. "Add dark mode toggle", "Make cards drag-and-drop", "Add export button")...`}
              rows={2}
              className="w-full bg-transparent px-3 py-2 text-xs text-gray-100 placeholder-gray-500 resize-none focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!promptInput.trim() || isStreaming}
              className={`mr-2 p-2 rounded-lg transition-all ${
                promptInput.trim() && !isStreaming
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Live Interactive Sandbox & Code Inspector (58% width) */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] overflow-hidden">
        {/* Right Pane Navigation Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#12141a] border-b border-[#222634] text-xs">
          <div className="flex items-center gap-1 bg-[#181a22] p-0.5 rounded-lg border border-[#242834]">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                activeTab === "preview"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                activeTab === "code"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Inspector</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Powered by Your BYOK Models</span>
          </div>
        </div>

        {/* Tab Canvas Area */}
        <div className="flex-1 p-2 sm:p-4 overflow-hidden">
          {activeTab === "preview" ? (
            <SandboxPreview
              code={displayCode}
              isStreaming={isStreaming}
              onAskFix={handleFixError}
            />
          ) : (
            <CodeViewer code={displayCode} filename={`${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jsx`} />
          )}
        </div>
      </div>
    </div>
  );
};
