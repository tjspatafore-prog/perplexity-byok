"use client";

import React from "react";
import { Search, Zap, Bot, Sparkles } from "lucide-react";
import { WorkspaceView } from "@/lib/types";

interface NavigationTabsProps {
  currentView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentView,
  onSelectView,
}) => {
  return (
    <div className="flex items-center bg-[#13151b] p-1 rounded-xl border border-[#222634] text-xs">
      {/* Search & Research */}
      <button
        type="button"
        onClick={() => onSelectView("search")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
          currentView === "search"
            ? "bg-[#202534] text-perplexity-teal font-semibold shadow-sm border border-perplexity-teal/30"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="Search & Deep Research"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Research & Search</span>
        <span className="sm:hidden">Search</span>
      </button>

      {/* App & Web Builder (Base44 Studio) */}
      <button
        type="button"
        onClick={() => onSelectView("builder")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
          currentView === "builder"
            ? "bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm border border-cyan-500/40"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="Base44 App & Website Builder Studio"
      >
        <Zap className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden sm:inline">App Builder Studio</span>
        <span className="sm:hidden">Builder</span>
        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-200 font-mono hidden md:inline">
          Live
        </span>
      </button>

      {/* Super Agents */}
      <button
        type="button"
        onClick={() => onSelectView("agents")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
          currentView === "agents"
            ? "bg-purple-500/20 text-purple-300 font-semibold shadow-sm border border-purple-500/40"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="Autonomous Super Agents Roster"
      >
        <Bot className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden sm:inline">Super Agents</span>
        <span className="sm:hidden">Agents</span>
      </button>
    </div>
  );
};
