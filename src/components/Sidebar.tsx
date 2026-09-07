"use client";

import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  Search,
  Key,
  Compass,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Bot,
  FolderPlus,
  QrCode,
  Cloud,
} from "lucide-react";
import { ChatThread, ApiKeys, WorkspaceView } from "@/lib/types";

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onOpenSettings: () => void;
  onOpenGoogleWorkspace: () => void;
  onOpenAuth: () => void;
  onOpenDeviceSync: () => void;
  currentView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  keys: ApiKeys;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onOpenSettings,
  onOpenGoogleWorkspace,
  onOpenAuth,
  onOpenDeviceSync,
  currentView,
  onSelectView,
  keys,
  isOpen,
  onToggleOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const configuredKeyCount = Object.values(keys).filter(Boolean).length;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-64 bg-[#11131a] border-r border-[#222634] flex flex-col transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo & Brand */}
        <div className="p-4 space-y-3 border-b border-[#1e2230]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-cyan-500/20">
                ⚡
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">
                ai-byok<span className="text-cyan-400 font-light">.online</span>
              </span>
            </div>

            <button
              onClick={onToggleOpen}
              className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* New Search Thread Button */}
          <button
            onClick={() => {
              onSelectView("search");
              onNewThread();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#1c202c] hover:bg-[#252a3a] text-xs font-semibold text-white border border-[#2b3042] transition-colors group shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-perplexity-teal" /> New Thread
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#13151c] text-gray-400 border border-[#232734]">
              Ctrl+K
            </span>
          </button>
        </div>

        {/* Workspace Mode Quick Switchers */}
        <div className="px-3 py-2 border-b border-[#1e2230] space-y-1 text-xs">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Workspace Hub
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectView("search");
              if (isOpen) onToggleOpen();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
              currentView === "search"
                ? "bg-[#1f2434] text-perplexity-teal font-semibold border border-perplexity-teal/30"
                : "text-gray-400 hover:bg-[#181a24] hover:text-gray-200"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search & Research</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectView("builder");
              if (isOpen) onToggleOpen();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
              currentView === "builder"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                : "text-gray-400 hover:bg-[#181a24] hover:text-gray-200"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>App Builder Studio</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              Live
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectView("agents");
              if (isOpen) onToggleOpen();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
              currentView === "agents"
                ? "bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/40"
                : "text-gray-400 hover:bg-[#181a24] hover:text-gray-200"
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" />
            <span>Super Agents</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenGoogleWorkspace();
              if (isOpen) onToggleOpen();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-400 hover:bg-[#181a24] hover:text-gray-200 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
            <span>Google Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenDeviceSync();
              if (isOpen) onToggleOpen();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-400 hover:bg-[#181a24] hover:text-cyan-300 transition-colors"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Fast QR Sync</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenAuth();
              if (isOpen) onToggleOpen();
            }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-gray-400 hover:bg-[#181a24] hover:text-purple-300 transition-colors"
          >
            <Cloud className="w-4 h-4 text-purple-400" />
            <span>Cloud Account Sync</span>
          </button>
        </div>

        {/* Search Threads Input */}
        <div className="px-3 pt-3">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past threads..."
              className="w-full bg-[#181a24] border border-[#252a3a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Thread History List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Recent Searches
          </div>

          {filteredThreads.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500 space-y-1">
              <p>No searches yet</p>
              <p className="text-[11px] text-gray-600">Ask a question to start</p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isActive = thread.id === activeThreadId && currentView === "search";
              return (
                <div
                  key={thread.id}
                  className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#1e2332] text-white font-medium"
                      : "text-gray-400 hover:bg-[#181a24] hover:text-gray-200"
                  }`}
                  onClick={() => {
                    onSelectView("search");
                    onSelectThread(thread.id);
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-6">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-gray-500 group-hover:text-perplexity-teal" />
                    <span className="truncate">{thread.title || "Untitled query"}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: Settings */}
        <div className="p-3 border-t border-[#1e2230] space-y-2">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#161822] hover:bg-[#202432] border border-[#252a3a] text-xs text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-perplexity-teal" />
              <span>API Keys & Settings</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                configuredKeyCount > 0
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                  : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
              }`}
            >
              {configuredKeyCount}/7
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
