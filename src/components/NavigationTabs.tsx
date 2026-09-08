"use client";

import React from "react";
import {
  Search,
  Zap,
  Bot,
  Database,
  Terminal,
  Radio,
} from "lucide-react";
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
    <div className="flex items-center bg-[#11131a] p-1 rounded-xl border border-[#222736] text-xs max-w-full overflow-x-auto no-scrollbar">
      {/* 1. Research & Search */}
      <button
        type="button"
        onClick={() => onSelectView("search")}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 ${
          currentView === "search"
            ? "bg-[#1f2434] text-perplexity-teal font-semibold shadow-sm border border-perplexity-teal/30"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="Deep Research & Web Search"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Research</span>
      </button>

      {/* 2. App & Web Builder (Base44 Studio) */}
      <button
        type="button"
        onClick={() => onSelectView("builder")}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 ${
          currentView === "builder"
            ? "bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm border border-cyan-500/40"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="Base44 App & Website Builder Studio"
      >
        <Zap className="w-3.5 h-3.5 text-cyan-400" />
        <span className="hidden md:inline">App Studio</span>
        <span className="md:hidden">Apps</span>
      </button>

      {/* 3. In-Browser SQLite & Database Studio */}
      <button
        type="button"
        onClick={() => onSelectView("database")}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 ${
          currentView === "database"
            ? "bg-amber-500/20 text-amber-300 font-semibold shadow-sm border border-amber-500/40"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="In-Browser SQLite Relational Database Engine"
      >
        <Database className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden md:inline">Database</span>
        <span className="md:hidden">DB</span>
      </button>

      {/* 4. Local Desktop Bridge & Terminal */}
      <button
        type="button"
        onClick={() => onSelectView("desktop")}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 ${
          currentView === "desktop"
            ? "bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm border border-emerald-500/40"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="Local Desktop Bridge & Terminal Agent"
      >
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden md:inline">Desktop</span>
        <span className="md:hidden">Terminal</span>
      </button>

      {/* 5. Autonomous Monitors */}
      <button
        type="button"
        onClick={() => onSelectView("monitors")}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 ${
          currentView === "monitors"
            ? "bg-indigo-500/20 text-indigo-300 font-semibold shadow-sm border border-indigo-500/40"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="Scheduled Background Monitors"
      >
        <Radio className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden md:inline">Monitors</span>
        <span className="md:hidden">Radar</span>
      </button>

      {/* 6. Super Agents Studio */}
      <button
        type="button"
        onClick={() => onSelectView("agents")}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 ${
          currentView === "agents"
            ? "bg-purple-500/20 text-purple-300 font-semibold shadow-sm border border-purple-500/40"
            : "text-gray-400 hover:text-gray-200"
        }`}
        title="Autonomous Super Agents Roster"
      >
        <Bot className="w-3.5 h-3.5 text-purple-400" />
        <span className="hidden md:inline">Agents</span>
      </button>
    </div>
  );
};
