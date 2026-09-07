"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Search,
  Compass,
  Zap,
  Globe,
  HelpCircle,
  Key,
  ShieldCheck,
  BookOpen,
  Users,
  FileText,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { AnswerView } from "@/components/AnswerView";
import { SettingsModal } from "@/components/SettingsModal";
import { AppBuilderView } from "@/components/builder/AppBuilderView";
import { SuperAgentStudio } from "@/components/agents/SuperAgentStudio";
import { GoogleWorkspaceModal } from "@/components/workspace/GoogleWorkspaceModal";
import {
  ChatThread,
  Message,
  FocusMode,
  AppSettings,
  AVAILABLE_MODELS,
  SwarmAgentMessage,
  UploadedDocument,
  WorkspaceView,
} from "@/lib/types";
import {
  loadStoredSettings,
  saveStoredSettings,
  loadThreads,
  saveThreads,
} from "@/lib/storage";

const HERO_SUGGESTIONS = [
  "What are the latest discoveries from the James Webb Space Telescope?",
  "How does DeepSeek V3 architecture compare to LLaMA 3?",
  "Summarize key breakthroughs in quantum computing this year",
  "Explain CRISPR prime editing and its latest clinical trials",
];

export default function Home() {
  const [settings, setSettings] = useState<AppSettings>({
    keys: {},
    defaultModel: "gemini-3.8-flash-high",
    defaultFocusMode: "web",
    autoSpeak: false,
    deepgramVoice: "flux-brooke-en",
  });

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>("gemini-3.8-flash-high");
  const [focusMode, setFocusMode] = useState<FocusMode>("web");
  const [currentView, setCurrentView] = useState<WorkspaceView>("search");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial settings and threads from localStorage on mount
  useEffect(() => {
    const loadedSettings = loadStoredSettings();
    setSettings(loadedSettings);
    setSelectedModelId(loadedSettings.defaultModel || "gemini-3.8-flash-high");
    setFocusMode(loadedSettings.defaultFocusMode || "web");

    const loadedThreads = loadThreads();
    setThreads(loadedThreads);
    if (loadedThreads.length > 0) {
      setActiveThreadId(loadedThreads[0].id);
    }
  }, []);

  // Keyboard shortcut: Ctrl+K for new thread
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleNewThread();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeThread = threads.find((t) => t.id === activeThreadId) || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveStoredSettings(updated);
    if (newSettings.defaultModel) setSelectedModelId(newSettings.defaultModel);
    if (newSettings.defaultFocusMode) setFocusMode(newSettings.defaultFocusMode);
  };

  const handleNewThread = () => {
    setActiveThreadId(null);
  };

  const handleDeleteThread = (threadId: string) => {
    const remaining = threads.filter((t) => t.id !== threadId);
    setThreads(remaining);
    saveThreads(remaining);
    if (activeThreadId === threadId) {
      setActiveThreadId(remaining[0]?.id || null);
    }
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    const target = threads.find((t) => t.id === threadId);
    if (target) {
      setSelectedModelId(target.modelId || settings.defaultModel);
      setFocusMode(target.focusMode || "web");
    }
    setIsSidebarOpen(false);
  };

  const handleSearch = async (query: string, files?: UploadedDocument[]) => {
    if (!query.trim() || isLoading) return;

    // Check if key is available for selected model
    const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId);
    if (currentModel) {
      const requiredKey = settings.keys[currentModel.provider as keyof typeof settings.keys];
      if (!requiredKey) {
        setIsSettingsOpen(true);
        alert(
          `Please configure your ${currentModel.provider.toUpperCase()} API key in Settings to use ${currentModel.name}.`
        );
        return;
      }
    }

    setIsLoading(true);

    const userMessageId = `msg-${Date.now()}-u`;
    const assistantMessageId = `msg-${Date.now()}-a`;

    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      content: query,
      attachedFiles: files && files.length > 0 ? files : undefined,
      createdAt: Date.now(),
    };

    const initialAssistantMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      sources: [],
      searchSteps: [{ text: "Initializing web search...", status: "active" }],
      modelUsed: currentModel?.name || selectedModelId,
      createdAt: Date.now(),
    };

    let currentThread: ChatThread;

    if (!activeThreadId) {
      const newThreadId = `thread-${Date.now()}`;
      currentThread = {
        id: newThreadId,
        title: query.slice(0, 50),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        modelId: selectedModelId,
        focusMode,
        messages: [userMsg, initialAssistantMsg],
      };
      const updatedThreads = [currentThread, ...threads];
      setThreads(updatedThreads);
      setActiveThreadId(newThreadId);
      saveThreads(updatedThreads);
    } else {
      currentThread = {
        ...activeThread!,
        updatedAt: Date.now(),
        messages: [...activeThread!.messages, userMsg, initialAssistantMsg],
      };
      const updatedThreads = threads.map((t) => (t.id === currentThread.id ? currentThread : t));
      setThreads(updatedThreads);
      saveThreads(updatedThreads);
    }

    try {
      // Build conversation history excluding the current query
      const history = currentThread.messages
        .slice(0, -2)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          history,
          modelId: selectedModelId,
          focusMode,
          keys: settings.keys,
          modelAliases: settings.modelAliases || {},
          swarmRoster: settings.swarmRoster || [],
          files: files && files.length > 0 ? files : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${res.status}`);
      }

      if (!res.body) throw new Error("No response stream body available");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";
      let currentSources: any[] = [];
      let currentDialogue: SwarmAgentMessage[] = [];
      let currentSteps: any[] = [
        {
          text:
            focusMode === "swarm"
              ? "Assembling multi-agent research team & search evidence..."
              : "Searching web sources...",
          status: "active",
        },
      ];

      const updateAssistantInState = (updater: (prevMsg: Message) => Message) => {
        setThreads((prevThreads) => {
          const threadIdx = prevThreads.findIndex((t) => t.id === currentThread.id);
          if (threadIdx === -1) return prevThreads;
          const targetThread = prevThreads[threadIdx];
          const updatedMessages = targetThread.messages.map((m) =>
            m.id === assistantMessageId ? updater(m) : m
          );
          const updatedThread = { ...targetThread, messages: updatedMessages };
          const newThreads = [...prevThreads];
          newThreads[threadIdx] = updatedThread;
          saveThreads(newThreads);
          return newThreads;
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const block of parts) {
          if (!block.trim()) continue;

          let eventType = "message";
          let dataStr = "";

          const lines = block.split("\n");
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.replace("event:", "").trim();
            } else if (line.startsWith("data:")) {
              dataStr = line.replace("data:", "").trim();
            }
          }

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (eventType === "step") {
              currentSteps = [
                ...currentSteps.map((s) => ({ ...s, status: "completed" as const })),
                { text: parsed.text, status: parsed.status || "active" },
              ];
              updateAssistantInState((m) => ({ ...m, searchSteps: currentSteps }));
            } else if (eventType === "sources") {
              currentSources = parsed;
              updateAssistantInState((m) => ({ ...m, sources: parsed }));
            } else if (eventType === "swarm_agent_start") {
              const newAgent: SwarmAgentMessage = parsed;
              currentDialogue = [
                ...currentDialogue.filter((a) => a.agentId !== newAgent.agentId),
                newAgent,
              ];
              updateAssistantInState((m) => ({ ...m, swarmDialogue: currentDialogue }));
            } else if (eventType === "swarm_agent_delta") {
              const { agentId, delta } = parsed;
              currentDialogue = currentDialogue.map((a) =>
                a.agentId === agentId
                  ? { ...a, content: a.content + delta, status: "streaming" as const }
                  : a
              );
              updateAssistantInState((m) => ({ ...m, swarmDialogue: currentDialogue }));
              scrollToBottom();
            } else if (eventType === "swarm_agent_done") {
              const { agentId, fullContent } = parsed;
              currentDialogue = currentDialogue.map((a) =>
                a.agentId === agentId
                  ? { ...a, content: fullContent || a.content, status: "completed" as const }
                  : a
              );
              updateAssistantInState((m) => ({ ...m, swarmDialogue: currentDialogue }));
            } else if (eventType === "delta") {
              accumulatedText += parsed.delta;
              updateAssistantInState((m) => ({ ...m, content: accumulatedText }));
              scrollToBottom();
            } else if (eventType === "done") {
              updateAssistantInState((m) => ({
                ...m,
                content: parsed.fullText || accumulatedText,
                followUps: parsed.followUps || [],
                searchSteps: currentSteps.map((s) => ({ ...s, status: "completed" })),
                swarmDialogue: currentDialogue.map((a) => ({ ...a, status: "completed" })),
              }));
            } else if (eventType === "error") {
              updateAssistantInState((m) => ({
                ...m,
                content: `**Error:** ${parsed.message}`,
              }));
            }
          } catch (e) {
            console.error("SSE parse error", e);
          }
        }
      }
    } catch (err: any) {
      console.error("Search error:", err);
      setThreads((prevThreads) => {
        const threadIdx = prevThreads.findIndex((t) => t.id === currentThread.id);
        if (threadIdx === -1) return prevThreads;
        const targetThread = prevThreads[threadIdx];
        const updatedMessages = targetThread.messages.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: `⚠️ **Request Error:** ${err.message || "Failed to retrieve response."}` }
            : m
        );
        const updatedThread = { ...targetThread, messages: updatedMessages };
        const newThreads = [...prevThreads];
        newThreads[threadIdx] = updatedThread;
        saveThreads(newThreads);
        return newThreads;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const configuredCount = Object.values(settings.keys).filter(Boolean).length;

  return (
    <div className="flex h-screen overflow-hidden bg-[#191a1a]">
      {/* Sidebar */}
      <Sidebar
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewThread={handleNewThread}
        onDeleteThread={handleDeleteThread}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGoogleWorkspace={() => setIsGoogleModalOpen(true)}
        currentView={currentView}
        onSelectView={setCurrentView}
        keys={settings.keys}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onNewThread={handleNewThread}
          onOpenGoogleWorkspace={() => setIsGoogleModalOpen(true)}
          currentView={currentView}
          onSelectView={setCurrentView}
          keys={settings.keys}
          currentThreadTitle={activeThread?.title}
          isGoogleConnected={!!settings.googleWorkspace?.isConnected}
        />

        {/* Workspace Body */}
        {currentView === "builder" ? (
          <main className="flex-1 h-full overflow-hidden w-full">
            <AppBuilderView
              keys={settings.keys}
              modelAliases={settings.modelAliases}
              customAgents={settings.customAgents}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </main>
        ) : currentView === "agents" ? (
          <main className="flex-1 overflow-y-auto w-full">
            <SuperAgentStudio
              customAgents={settings.customAgents || []}
              onSaveCustomAgents={(agents) => handleSaveSettings({ customAgents: agents })}
              onLaunchBuilderWithAgent={() => {
                setCurrentView("builder");
              }}
              onAddToSwarm={(modelId) => {
                const current = settings.swarmRoster || [];
                if (!current.includes(modelId)) {
                  handleSaveSettings({ swarmRoster: [...current, modelId] });
                  alert("Added model to your Swarm Team roster!");
                } else {
                  alert("This model is already in your Swarm Team.");
                }
              }}
            />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto flex flex-col">
            {!activeThread || activeThread.messages.length === 0 ? (
            /* Empty State Hero (Perplexity style) */
            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-12 space-y-8 animate-fadeIn">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#202222] border border-[#2e3030] text-xs text-gray-300">
                  {focusMode === "deep-research" ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-cyan-300 font-medium">
                        Deep Research Mode: Crawls 30+ sources to build exhaustive whitepapers
                      </span>
                    </>
                  ) : focusMode === "swarm" ? (
                    <>
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-purple-300 font-medium">
                        Swarm Mode: Multi-Agent debate, peer review & consensus synthesis
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-perplexity-teal" />
                      <span>Real-time web retrieval & multi-model reasoning</span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-white font-serif">
                  Where knowledge begins
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                  Bring your keys for Gemini, Claude, GPT-4o, Grok, Kimi, Qwen & Deepgram.
                </p>
              </div>

              {/* Primary Omni Search Bar */}
              <div className="w-full">
                <SearchBar
                  onSearch={handleSearch}
                  selectedModelId={selectedModelId}
                  onSelectModel={setSelectedModelId}
                  focusMode={focusMode}
                  onSelectFocusMode={setFocusMode}
                  keys={settings.keys}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  isLoading={isLoading}
                  swarmRoster={settings.swarmRoster}
                  onUpdateSwarmRoster={(newRoster) => handleSaveSettings({ swarmRoster: newRoster })}
                />
              </div>

              {/* Quick Suggestion Pills */}
              <div className="w-full max-w-2xl pt-2">
                <div className="text-xs text-gray-500 mb-2.5">Try searching:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HERO_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(item)}
                      className="p-3 rounded-xl bg-[#202222]/60 hover:bg-[#202222] border border-[#282a2a] hover:border-[#383a3a] text-xs text-gray-300 text-left transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{item}</span>
                      <Search className="w-3 h-3 text-gray-500 group-hover:text-perplexity-teal shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Status Notice */}
              {configuredCount === 0 && (
                <div className="p-4 rounded-xl bg-perplexity-teal/10 border border-perplexity-teal/20 text-xs text-gray-300 flex items-center justify-between gap-4 max-w-md w-full text-left">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-perplexity-teal" /> No API keys configured yet
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Add your Gemini, OpenAI, Claude, Grok, Kimi or Qwen key to begin.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-perplexity-teal hover:bg-perplexity-tealHover text-[#121313] font-semibold text-xs shrink-0 transition-colors"
                  >
                    Add Keys
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Active Thread Conversation */
            <div className="flex-1 flex flex-col justify-between space-y-8">
              <div className="space-y-8">
                {activeThread.messages.map((message, index) => {
                  if (message.role === "user") {
                    return (
                      <div key={message.id} className="pt-2 border-b border-[#242626] pb-4 space-y-2">
                        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                          {message.content}
                        </h2>
                        {message.attachedFiles && message.attachedFiles.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {message.attachedFiles.map((doc) => (
                              <div
                                key={doc.id}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#202222] border border-[#2e3030] text-xs text-purple-300 font-medium"
                              >
                                <FileText className="w-3.5 h-3.5 text-purple-400" />
                                <span>{doc.name}</span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  ({(doc.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isLastAssistant =
                    index === activeThread.messages.length - 1 && isLoading;

                  return (
                    <AnswerView
                      key={message.id}
                      message={message}
                      query={activeThread.messages[index - 1]?.content || activeThread.title}
                      deepgramKey={settings.keys.deepgram}
                      deepgramVoice={settings.deepgramVoice}
                      onFollowUpClick={handleSearch}
                      isStreaming={isLastAssistant}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Search Input for Follow-ups */}
              <div className="no-print sticky bottom-0 bg-gradient-to-t from-[#191a1a] via-[#191a1a] to-transparent pt-4 pb-2 mt-8">
                <SearchBar
                  onSearch={handleSearch}
                  selectedModelId={selectedModelId}
                  onSelectModel={setSelectedModelId}
                  focusMode={focusMode}
                  onSelectFocusMode={setFocusMode}
                  keys={settings.keys}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  isLoading={isLoading}
                  swarmRoster={settings.swarmRoster}
                  onUpdateSwarmRoster={(newRoster) => handleSaveSettings({ swarmRoster: newRoster })}
                />
              </div>
            </div>
          )}
          </main>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Google Workspace Modal */}
      <GoogleWorkspaceModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        settings={settings.googleWorkspace}
        onSaveSettings={(gw) => handleSaveSettings({ googleWorkspace: gw })}
        exportContent={
          activeThread?.messages?.length
            ? {
                title: activeThread.title,
                content: activeThread.messages[activeThread.messages.length - 1]?.content || "",
              }
            : undefined
        }
      />
    </div>
  );
}
