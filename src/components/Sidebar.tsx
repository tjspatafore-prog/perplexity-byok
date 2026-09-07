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
} from "lucide-react";
import { ChatThread, ApiKeys } from "@/lib/types";

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  onDeleteThread: (threadId: string) => void;
  onOpenSettings: () => void;
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
        className={`fixed lg:static top-0 left-0 bottom-0 z-40 w-64 bg-[#141515] border-r border-[#242626] flex flex-col transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo & New Thread */}
        <div className="p-4 space-y-3 border-b border-[#202222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-perplexity-teal flex items-center justify-center font-bold text-[#121313] text-sm shadow-md">
                *
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">
                Perplexity <span className="text-perplexity-teal font-light">BYOK</span>
              </span>
            </div>

            <button
              onClick={onToggleOpen}
              className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onNewThread}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#202222] hover:bg-[#282a2a] text-xs font-semibold text-white border border-[#2e3030] transition-colors group shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-perplexity-teal" /> New Thread
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#161717] text-gray-400 border border-[#262828]">
              Ctrl+K
            </span>
          </button>
        </div>

        {/* Search Threads */}
        <div className="px-3 pt-3">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search library..."
              className="w-full bg-[#1b1c1c] border border-[#262828] rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-perplexity-teal"
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
              const isActive = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#202222] text-white font-medium"
                      : "text-gray-400 hover:bg-[#1b1c1c] hover:text-gray-200"
                  }`}
                  onClick={() => onSelectThread(thread.id)}
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
        <div className="p-3 border-t border-[#202222] space-y-2">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#1a1b1b] hover:bg-[#202222] border border-[#262828] text-xs text-gray-300 hover:text-white transition-colors"
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
