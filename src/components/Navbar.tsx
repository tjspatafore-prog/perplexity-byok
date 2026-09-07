"use client";

import React from "react";
import { Menu, Settings, Key, Sparkles, Plus, FolderPlus, Cloud, QrCode } from "lucide-react";
import { ApiKeys, WorkspaceView } from "@/lib/types";
import { NavigationTabs } from "./NavigationTabs";

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onNewThread: () => void;
  onOpenGoogleWorkspace: () => void;
  onOpenAuth: () => void;
  onOpenDeviceSync: () => void;
  currentView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  keys: ApiKeys;
  currentThreadTitle?: string;
  isGoogleConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenSettings,
  onNewThread,
  onOpenGoogleWorkspace,
  onOpenAuth,
  onOpenDeviceSync,
  currentView,
  onSelectView,
  keys,
  currentThreadTitle,
  isGoogleConnected = false,
}) => {
  const configuredCount = Object.values(keys).filter(Boolean).length;

  return (
    <header className="sticky top-0 z-20 h-14 bg-[#14161f]/95 backdrop-blur-md border-b border-[#222634] px-4 flex items-center justify-between gap-2">
      {/* Left: Hamburger & Brand/Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202534] transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 min-w-0">
          <span className="font-semibold text-xs sm:text-sm text-gray-300 truncate max-w-[180px]">
            {currentThreadTitle || "ai-byok.online"}
          </span>
        </div>
      </div>

      {/* Center: Navigation Mode Tabs */}
      <div className="flex-1 max-w-md mx-auto flex justify-center">
        <NavigationTabs currentView={currentView} onSelectView={onSelectView} />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Fast QR Sync Button */}
        <button
          onClick={onOpenDeviceSync}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[#1c202c] hover:bg-[#252a3a] text-cyan-300 border border-cyan-500/30 transition-colors"
          title="1-Click Device Sync (QR Code)"
        >
          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">QR Sync</span>
        </button>

        {/* Cloud Account Sync Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[#1c202c] hover:bg-[#252a3a] text-purple-300 border border-purple-500/30 transition-colors"
          title="User Account & Cloud Vault Sync"
        >
          <Cloud className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Account</span>
        </button>

        {/* Google Workspace Button */}
        <button
          onClick={onOpenGoogleWorkspace}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            isGoogleConnected
              ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
              : "bg-[#1c202c] hover:bg-[#252a3a] text-gray-300 border-[#2b3142]"
          }`}
          title="Google Workspace (Drive, Docs, Sheets)"
        >
          <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Workspace</span>
        </button>

        {/* New Thread (in search view) */}
        {currentView === "search" && (
          <button
            onClick={onNewThread}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1c202c] hover:bg-[#252a3a] text-gray-200 border border-[#2b3142] transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-perplexity-teal" />
            <span className="hidden sm:inline">New</span>
          </button>
        )}

        {/* API Keys */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#1c202c] hover:bg-[#252a3a] text-gray-200 border border-[#2b3142] transition-colors"
          title="Configure API Keys"
        >
          <Key className="w-3.5 h-3.5 text-perplexity-teal" />
          <span className="hidden sm:inline">Keys</span>
          <span
            className={`w-2 h-2 rounded-full ${
              configuredCount > 0 ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
        </button>
      </div>
    </header>
  );
};
