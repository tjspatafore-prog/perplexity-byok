"use client";

import React from "react";
import { Menu, Settings, Key, Sparkles, Plus } from "lucide-react";
import { ApiKeys } from "@/lib/types";

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onNewThread: () => void;
  keys: ApiKeys;
  currentThreadTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenSettings,
  onNewThread,
  keys,
  currentThreadTitle,
}) => {
  const configuredCount = Object.values(keys).filter(Boolean).length;

  return (
    <header className="sticky top-0 z-20 h-14 bg-[#191a1a]/90 backdrop-blur-md border-b border-[#242626] px-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202222] transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-xs sm:text-sm text-gray-300 truncate max-w-[200px] sm:max-w-md">
            {currentThreadTitle || "Perplexity BYOK"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onNewThread}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#202222] hover:bg-[#282a2a] text-gray-200 border border-[#2e3030] transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-perplexity-teal" />
          <span className="hidden sm:inline">New</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#202222] hover:bg-[#282a2a] text-gray-200 border border-[#2e3030] transition-colors"
          title="Configure API Keys"
        >
          <Key className="w-3.5 h-3.5 text-perplexity-teal" />
          <span className="hidden sm:inline">Keys</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>
      </div>
    </header>
  );
};
