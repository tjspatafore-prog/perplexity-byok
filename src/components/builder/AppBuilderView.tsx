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
  MessageSquare,
  Hammer,
  CheckCircle2,
  ExternalLink,
  Copy,
  Terminal,
  FileCode,
  X,
  MousePointerClick,
  FolderOpen,
} from "lucide-react";
import {
  AppProject,
  AppVersion,
  SuperAgent,
  ApiKeys,
  BUILTIN_SUPER_AGENTS,
  AVAILABLE_MODELS,
  ProjectFile,
} from "@/lib/types";
import { BUILDER_STARTER_TEMPLATES } from "@/lib/builder/system-prompt";
import {
  STARTER_TEMPLATES,
  SAAS_DASHBOARD_CODE,
  StarterTemplate,
} from "@/lib/builder/starterTemplates";
import { SandboxPreview, SelectedElementInfo } from "./SandboxPreview";
import { CodeViewer } from "./CodeViewer";
import { ProjectExplorer } from "./ProjectExplorer";

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
  mode?: "discuss" | "build";
  versionNumber?: number;
  timestamp: number;
}

// Default initial code from pre-built starter templates
const DEFAULT_INITIAL_CODE = SAAS_DASHBOARD_CODE;

export const AppBuilderView: React.FC<AppBuilderViewProps> = ({
  keys,
  modelAliases = {},
  customAgents = [],
  onOpenSettings,
}) => {
  const allAgents = [...BUILTIN_SUPER_AGENTS, ...customAgents];

  // Active Project State
  const [projectTitle, setProjectTitle] = useState("Pulse Operations & Analytics");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("full-stack-architect");
  const [selectedModelId, setSelectedModelId] = useState<string>("claude-3-7-sonnet-latest");
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "files">("preview");

  // Base44 Conversational Mode: "discuss" (brainstorm & architect) vs "build" (synthesize live app)
  const [builderMode, setBuilderMode] = useState<"discuss" | "build">("build");

  // Visual Click-to-Edit Selected Element from Sandbox
  const [selectedElement, setSelectedElement] = useState<SelectedElementInfo | null>(null);

  // Emergent Multi-Agent Task Progress Stage (0 = idle, 1 = spec, 2 = components, 3 = interactivity, 4 = verified)
  const [checklistStage, setChecklistStage] = useState<number>(0);

  // GitHub & Project Export Modal
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState<boolean>(false);

  // Versions history
  const [versions, setVersions] = useState<AppVersion[]>([
    {
      id: "v1",
      versionNumber: 1,
      prompt: "Initial SaaS KPI Dashboard",
      code: DEFAULT_INITIAL_CODE,
      language: "jsx",
      explanation: "Live interactive SaaS operations dashboard with ARR simulation, financial metrics, and transaction ledger.",
      timestamp: Date.now(),
    },
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number>(0);

  // Virtual Multi-File Codebase
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([
    {
      id: "main-app",
      name: "App.jsx",
      path: "src/App.jsx",
      content: DEFAULT_INITIAL_CODE,
      language: "jsx",
    },
    {
      id: "header-comp",
      name: "Header.jsx",
      path: "src/components/Header.jsx",
      content: `export function Header({ title, completedCount, totalCount }) {\n  return (\n    <div className="flex items-center justify-between border-b border-gray-800 pb-5">\n      <h1 className="text-xl font-bold text-white">{title}</h1>\n      <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">\n        {completedCount} / {totalCount} Completed\n      </div>\n    </div>\n  );\n}`,
      language: "jsx",
    },
    {
      id: "schema-sql",
      name: "schema.sql",
      path: "src/db/schema.sql",
      content: `-- Project Relational Database Schema\nCREATE TABLE IF NOT EXISTS tasks (\n  id INTEGER PRIMARY KEY,\n  title TEXT NOT NULL,\n  tag TEXT DEFAULT 'Feature',\n  priority TEXT DEFAULT 'Medium',\n  done BOOLEAN DEFAULT false,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`,
      language: "sql",
    },
    {
      id: "package-json",
      name: "package.json",
      path: "package.json",
      content: `{\n  "name": "pulse-operations-app",\n  "version": "1.0.0",\n  "private": true,\n  "dependencies": {\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1",\n    "lucide-react": "^0.475.0"\n  }\n}`,
      language: "json",
    },
    {
      id: "readme-md",
      name: "README.md",
      path: "README.md",
      content: `# Pulse Operations & Analytics\n\nBuilt live with [ai-byok.online](https://ai-byok.online) in Base44 Studio mode.\n\n## Quick Start\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``,
      language: "md",
    },
  ]);
  const [activeFileId, setActiveFileId] = useState<string>("main-app");

  // Chat conversation
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      role: "assistant",
      content:
        "Welcome to the Base44 App & Website Builder Studio! Toggle between **Discuss Mode** (brainstorm architecture without touching code) and **Build Mode** (live code synthesis), or click **'Inspect Element'** in the preview to edit any visual component directly.",
      mode: "build",
      versionNumber: 1,
      timestamp: Date.now(),
    },
  ]);
  const [promptInput, setPromptInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingRawText, setStreamingRawText] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const currentVersion = versions[currentVersionIndex] || versions[versions.length - 1];

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingRawText]);

  // Sync main app code to projectFiles
  useEffect(() => {
    if (currentVersion?.code) {
      setProjectFiles((prev) =>
        prev.map((f) => (f.id === "main-app" ? { ...f, content: currentVersion.code } : f))
      );
    }
  }, [currentVersion?.code]);

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

  const handleSendMessage = async (customPrompt?: string, forceMode?: "discuss" | "build") => {
    const rawUserPrompt = (customPrompt || promptInput).trim();
    if (!rawUserPrompt || isStreaming) return;

    // If an element was inspected, inject target context into prompt
    let userPrompt = rawUserPrompt;
    if (selectedElement) {
      userPrompt = `[Targeted Element: <${selectedElement.tag} ${
        selectedElement.className ? `class="${selectedElement.className.slice(0, 50)}"` : ""
      }> with text "${selectedElement.text}"]: ${rawUserPrompt}`;
    }

    const activeMode = forceMode || builderMode;

    // Check if key is configured for selected model
    const currentModelDef = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);
    if (currentModelDef) {
      const requiredKey = keys[currentModelDef.provider as keyof ApiKeys];
      if (!requiredKey) {
        onOpenSettings();
        alert(
          `Please configure your ${currentModelDef.provider.toUpperCase()} API key in Settings to build with ${currentModelDef.name}.`
        );
        return;
      }
    }

    setPromptInput("");
    setSelectedElement(null);
    setIsStreaming(true);
    setStreamingRawText("");
    setChecklistStage(1);

    const userMessageId = `u-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMessageId,
        role: "user",
        content: userPrompt,
        mode: activeMode,
        timestamp: Date.now(),
      },
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
          mode: activeMode,
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

              // Update checklist stage as output grows
              if (activeMode === "build") {
                if (accumulatedText.length > 300 && checklistStage < 2) setChecklistStage(2);
                if (accumulatedText.length > 1000 && checklistStage < 3) setChecklistStage(3);
                if (accumulatedText.includes("```") && checklistStage < 4) setChecklistStage(4);
              }
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }

      // Finish generation
      setChecklistStage(4);

      if (activeMode === "discuss") {
        // In Discuss Mode: Keep existing code safe, append discussion advice
        setMessages([
          ...newMessages,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content:
              accumulatedText ||
              "I have analyzed your request. Click 'Adopt Plan & Switch to Build Mode' when you're ready to code this into the app!",
            mode: "discuss",
            timestamp: Date.now(),
          },
        ]);
      } else {
        // In Build Mode: Synthesize and bump app version
        const { code: newCode, explanation } = extractCodeFromMarkdown(accumulatedText);
        const newVersionNumber = versions.length + 1;
        const newVersion: AppVersion = {
          id: `v${newVersionNumber}`,
          versionNumber: newVersionNumber,
          prompt: rawUserPrompt,
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
            content:
              explanation ||
              "I have synthesized and updated your application. Check out the live preview on the right!",
            mode: "build",
            versionNumber: newVersionNumber,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      console.error("Builder stream error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Generation Error: ${
            err.message || "Failed to generate response. Please check your API key."
          }`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamingRawText("");
    }
  };

  const handleFixError = (runtimeError: string) => {
    handleSendMessage(
      `Fix this runtime error occurring in the application:\n${runtimeError}\nEnsure all undefined variables, missing state hooks, or syntax issues are resolved.`,
      "build"
    );
  };

  const handleDownloadAppFile = () => {
    const blob = new Blob([currentVersion?.code || DEFAULT_INITIAL_CODE], {
      type: "text/javascript;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = projectTitle.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.href = url;
    link.setAttribute("download", `${safeName || "App"}.jsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllProjectFiles = () => {
    projectFiles.forEach((file, index) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", file.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, index * 200);
    });
  };

  const handleCopyGitCommands = () => {
    const cmds = `# Initialize repository and deploy to GitHub / Vercel:\ngit init\ngit add .\ngit commit -m "Initial commit from ai-byok.online"\ngit branch -M main\n# Link your remote repo:\ngit remote add origin https://github.com/YOUR_USER/${projectTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}.git\ngit push -u origin main`;
    navigator.clipboard.writeText(cmds);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  // Switch Starter Templates (SaaS Dashboard, Kanban, E-Commerce, Blank Canvas)
  const handleSwitchTemplate = (templateId: string) => {
    const tpl = STARTER_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    setProjectTitle(tpl.title);
    const newVersion: AppVersion = {
      id: "v" + (versions.length + 1),
      versionNumber: versions.length + 1,
      prompt: `Switched template to ${tpl.name}`,
      code: tpl.code,
      language: "jsx",
      explanation: tpl.explanation,
      timestamp: Date.now(),
    };
    setVersions((prev) => [...prev, newVersion]);
    setCurrentVersionIndex(versions.length);

    // Update Virtual Files
    setProjectFiles((prev) =>
      prev.map((f) => (f.id === "main-app" ? { ...f, content: tpl.code } : f))
    );

    // Add chat message
    setMessages((prev) => [
      ...prev,
      {
        id: "msg-" + Date.now(),
        role: "assistant",
        content: `Switched template to **${tpl.name}** (${tpl.icon}). You can test its interactive state in the **Live Preview** on the right, or prompt me below to customize it!`,
        mode: "build",
        versionNumber: versions.length + 1,
        timestamp: Date.now(),
      },
    ]);
  };

  // Determine current active code (live stream code or selected version code)
  const displayCode =
    isStreaming && streamingRawText && builderMode === "build"
      ? extractCodeFromMarkdown(streamingRawText).code || currentVersion.code
      : currentVersion?.code || DEFAULT_INITIAL_CODE;

  const currentAgent = allAgents.find((a) => a.id === selectedAgentId) || allAgents[0];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-65px)] bg-[#0d0e12] overflow-hidden">
      {/* LEFT PANE: Studio Assistant Chat & Controls (42% width) */}
      <div className="w-full lg:w-[42%] flex flex-col h-full border-r border-[#222634] bg-[#12141a]">
        {/* Top Studio Bar */}
        <div className="p-3 border-b border-[#222634] space-y-2 bg-[#161922]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
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

            <div className="flex items-center gap-2">
              {/* Starter Template Switcher */}
              <div className="flex items-center gap-1 bg-[#1c202c] px-2 py-1 rounded-lg border border-[#2b3042] text-xs">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  onChange={(e) => handleSwitchTemplate(e.target.value)}
                  defaultValue="saas"
                  className="bg-transparent text-gray-200 focus:outline-none cursor-pointer text-xs"
                  title="Switch starter template"
                >
                  {STARTER_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#1c202c] text-gray-200">
                      {t.icon} {t.name}
                    </option>
                  ))}
                </select>
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

          {/* Base44 Mode Toggle: Discuss Mode vs Build Mode */}
          <div className="pt-1 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#11131a] p-1 rounded-xl border border-[#252a3a] text-xs">
              <button
                type="button"
                onClick={() => setBuilderMode("discuss")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  builderMode === "discuss"
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Brainstorm features, discuss architecture, and refine ideas without modifying the app code."
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discuss Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setBuilderMode("build")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  builderMode === "build"
                    ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                title="Synthesize and update application code live in the sandbox."
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Build Mode</span>
              </button>
            </div>

            <div className="text-[11px] text-gray-500 font-medium">
              {builderMode === "discuss" ? "💡 Brainstorming (Safe)" : "⚡ Live Code Synthesis"}
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
                    : "bg-[#1a1d27] border border-[#272c3d] text-gray-200 space-y-2.5"
                }`}
              >
                {/* Message Header Badge */}
                {msg.role === "assistant" && msg.mode && (
                  <div className="flex items-center gap-2 pb-1 border-b border-[#242938] text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                        msg.mode === "discuss"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {msg.mode === "discuss" ? "Architecture Discussion" : "Build Pass"}
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Adopt Plan Button in Discuss Mode */}
                {msg.role === "assistant" && msg.mode === "discuss" && (
                  <div className="pt-2 border-t border-[#272c3d]">
                    <button
                      type="button"
                      onClick={() => {
                        setBuilderMode("build");
                        handleSendMessage(
                          `Implement the proposed architecture and features discussed above:\n${msg.content.slice(
                            0,
                            300
                          )}...`,
                          "build"
                        );
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs hover:from-cyan-400 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all"
                    >
                      <Hammer className="w-3.5 h-3.5" />
                      <span>Adopt Plan & Switch to Build Mode</span>
                    </button>
                  </div>
                )}

                {msg.versionNumber && (
                  <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-medium pt-1">
                    <Check className="w-3 h-3 text-cyan-400" />
                    <span>Updated Live Preview to Version {msg.versionNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Emergent Multi-Agent Task Progress & Streaming Feedback */}
          {isStreaming && (
            <div className="flex gap-3 text-xs leading-relaxed animate-fadeIn">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 text-sm animate-pulse">
                ⚡
              </div>
              <div className="p-3.5 rounded-2xl bg-[#1a1d27] border border-[#272c3d] text-gray-300 space-y-3 max-w-[85%] w-full">
                {/* Emergent Task Checklist */}
                {builderMode === "build" && (
                  <div className="space-y-1.5 bg-[#12141c] p-2.5 rounded-xl border border-[#232738]">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Emergent Agent Cascade</span>
                      <span className="text-cyan-400">Phase {checklistStage}/4</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      <div
                        className={`flex items-center gap-1.5 ${
                          checklistStage >= 1 ? "text-cyan-300" : "text-gray-500"
                        }`}
                      >
                        {checklistStage > 1 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                        )}
                        <span>1. Spec & State Architecture Plan</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          checklistStage >= 2 ? "text-cyan-300" : "text-gray-500"
                        }`}
                      >
                        {checklistStage > 2 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : checklistStage === 2 ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                        )}
                        <span>2. Component & Tailwind Synthesis</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          checklistStage >= 3 ? "text-cyan-300" : "text-gray-500"
                        }`}
                      >
                        {checklistStage > 3 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : checklistStage === 3 ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                        )}
                        <span>3. State & Interactive Event Handlers</span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          checklistStage >= 4 ? "text-cyan-300" : "text-gray-500"
                        }`}
                      >
                        {checklistStage >= 4 ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
                        )}
                        <span>4. Self-Healing Syntax & Verification</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-cyan-300 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {builderMode === "discuss"
                      ? "Formulating architectural specification..."
                      : "Synthesizing code in real-time..."}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono line-clamp-3 bg-[#101218] p-2 rounded-lg">
                  {streamingRawText.slice(-150) || "Initializing agent stream..."}
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Starter Templates (if few messages) */}
        {messages.length <= 2 && (
          <div className="p-3 border-t border-[#222634] bg-[#141620]">
            <div className="text-[11px] text-gray-400 mb-2 font-medium">
              Prompt Starter Templates:
            </div>
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

        {/* Prompt Input Box with Visual Element Inspector Chip */}
        <div className="p-3 border-t border-[#222634] bg-[#161922] space-y-2">
          {/* Target Element Chip */}
          {selectedElement && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-950/60 border border-cyan-800/50 rounded-xl text-[11px] text-cyan-200 animate-fadeIn">
              <div className="flex items-center gap-1.5 truncate">
                <MousePointerClick className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
                <span className="font-semibold text-white">Targeted Component:</span>
                <span className="font-mono bg-cyan-900/60 px-1.5 py-0.5 rounded text-cyan-300 font-bold">
                  &lt;{selectedElement.tag}&gt;
                </span>
                {selectedElement.text && (
                  <span className="text-gray-300 truncate max-w-[140px]">
                    &quot;{selectedElement.text}&quot;
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedElement(null)}
                className="text-gray-400 hover:text-white px-1.5 py-0.5 text-[10px] rounded hover:bg-white/10"
              >
                ✕ Clear
              </button>
            </div>
          )}

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
              placeholder={
                selectedElement
                  ? `Instruct ${currentAgent.name} how to modify <${selectedElement.tag}> (e.g. "Make this button gradient blue and add an icon")...`
                  : builderMode === "discuss"
                  ? `Ask ${currentAgent.name} to brainstorm features, compare frameworks, or design UX flows...`
                  : `Instruct ${currentAgent.name} to build (e.g. "Add dark mode toggle", "Make cards drag-and-drop")...`
              }
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

      {/* RIGHT PANE: Live Interactive Sandbox & Multi-File Explorer (58% width) */}
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
              <span>Single JSX</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                activeTab === "files"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Project Files ({projectFiles.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* GitHub & Export Button */}
            <button
              type="button"
              onClick={() => setShowGithubModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1c202c] hover:bg-[#262c3c] border border-[#2e354a] text-xs text-gray-200 hover:text-white transition-colors"
              title="Export project code and push to GitHub"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export & GitHub</span>
            </button>
          </div>
        </div>

        {/* Tab Canvas Area */}
        <div className="flex-1 p-2 sm:p-4 overflow-hidden">
          {activeTab === "preview" ? (
            <SandboxPreview
              code={displayCode}
              isStreaming={isStreaming}
              onAskFix={handleFixError}
              onSelectElement={(el) => setSelectedElement(el)}
            />
          ) : activeTab === "code" ? (
            <CodeViewer
              code={displayCode}
              filename={`${projectTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jsx`}
            />
          ) : (
            <ProjectExplorer
              files={projectFiles}
              activeFileId={activeFileId}
              onSelectFile={setActiveFileId}
              onUpdateFileContent={(id, content) => {
                setProjectFiles((prev) =>
                  prev.map((f) => (f.id === id ? { ...f, content } : f))
                );
              }}
              onAddFile={(name, path) => {
                const newFile: ProjectFile = {
                  id: `f-${Date.now()}`,
                  name,
                  path,
                  content: `// ${name}\nexport default function ${name.replace(/[^a-zA-Z0-9]/g, "")}() {\n  return <div>New Component</div>;\n}`,
                  language: name.endsWith(".sql") ? "sql" : name.endsWith(".json") ? "json" : "jsx",
                };
                setProjectFiles((prev) => [...prev, newFile]);
                setActiveFileId(newFile.id);
              }}
              onDeleteFile={(id) => {
                setProjectFiles((prev) => prev.filter((f) => f.id !== id));
                setActiveFileId("main-app");
              }}
              onDownloadAll={handleDownloadAllProjectFiles}
            />
          )}
        </div>
      </div>

      {/* GitHub Project Export & Open-Source Hub Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#161822] border border-[#2b3145] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#252b3e] bg-[#1a1d2a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Export Project & GitHub Ready</h3>
                  <p className="text-[11px] text-gray-400">
                    Deploy your generated app anywhere or publish to GitHub
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGithubModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-5 overflow-y-auto text-xs text-gray-300">
              {/* Direct File Download */}
              <div className="space-y-2">
                <div className="font-semibold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span>1. Download Application Code</span>
                </div>
                <div className="flex items-center gap-3 bg-[#11131c] p-3 rounded-xl border border-[#24293a]">
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">
                      {projectTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jsx
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Stand-alone React 18 component with Tailwind CSS & Lucide Icons
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadAppFile}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#12131a] font-bold text-xs transition-colors shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download App</span>
                    </button>
                    <button
                      onClick={handleDownloadAllProjectFiles}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#202538] hover:bg-[#283048] text-white text-xs transition-colors shrink-0 border border-[#2f3852]"
                    >
                      <span>All Files</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Push to GitHub Terminal Commands */}
              <div className="space-y-2">
                <div className="font-semibold text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>2. Push to GitHub in 30 Seconds</span>
                  </div>
                  <button
                    onClick={handleCopyGitCommands}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                  >
                    {copiedGitCmd ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Commands</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#0f1118] p-3 rounded-xl border border-[#222738] font-mono text-[11px] text-gray-300 space-y-1 overflow-x-auto">
                  <div className="text-gray-500"># 1. Initialize local repository</div>
                  <div>git init</div>
                  <div className="text-gray-500"># 2. Stage and commit</div>
                  <div>git add .</div>
                  <div>git commit -m &quot;Deploy from ai-byok.online&quot;</div>
                  <div className="text-gray-500"># 3. Connect to your GitHub repo</div>
                  <div>
                    git remote add origin https://github.com/YOUR_USER/
                    {projectTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.git
                  </div>
                  <div>git push -u origin main</div>
                </div>
              </div>

              {/* Open-Source Inspirations & Codebases */}
              <div className="space-y-2 pt-2 border-t border-[#252b3e]">
                <div className="font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-perplexity-teal" />
                  <span>3. Open-Source Ecosystem Integrations</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  This studio leverages patterns from premier open-source repositories. Explore and star their work:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <a
                    href="https://github.com/stackblitz-labs/bolt.diy"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#11131c] hover:bg-[#181c28] border border-[#24293a] transition-colors group"
                  >
                    <div className="font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between">
                      <span>stackblitz-labs/bolt.diy</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Open-source Bolt.new WebContainer engine and multi-model BYOK
                    </div>
                  </a>

                  <a
                    href="https://github.com/codesandbox/sandpack"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#11131c] hover:bg-[#181c28] border border-[#24293a] transition-colors group"
                  >
                    <div className="font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between">
                      <span>codesandbox/sandpack</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      CodeSandbox&apos;s open-source in-browser live multi-file runtime
                    </div>
                  </a>

                  <a
                    href="https://github.com/openv0/openv0"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#11131c] hover:bg-[#181c28] border border-[#24293a] transition-colors group"
                  >
                    <div className="font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between">
                      <span>openv0/openv0</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Open-source generative UI component builder inspired by v0
                    </div>
                  </a>

                  <a
                    href="https://github.com/shadcn-ui/ui"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#11131c] hover:bg-[#181c28] border border-[#24293a] transition-colors group"
                  >
                    <div className="font-semibold text-white group-hover:text-cyan-400 flex items-center justify-between">
                      <span>shadcn-ui/ui</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400" />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Modern accessible UI component library for React applications
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
