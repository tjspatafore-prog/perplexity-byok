"use client";

import React from "react";
import { Menu, Settings, Key, Plus, FolderPlus, QrCode } from "lucide-react";
import { ApiKeys, WorkspaceView } from "@/lib/types";
import { GoogleUserProfile } from "@/lib/sync/google-sync";
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
  googleUser?: GoogleUserProfile | null;
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
  googleUser,
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
        {/* Google Sign In / User Profile Button */}
        {googleUser ? (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1c202c] hover:bg-[#252a3a] border border-blue-500/30 text-xs text-white transition-colors"
            title={`Signed in as ${googleUser.email} (Synced)`}
          >
            {googleUser.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.name}
                className="w-5 h-5 rounded-full border border-white/20"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center font-bold text-[10px]">
                {googleUser.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="hidden md:inline font-medium text-gray-200">
              {googleUser.name.split(" ")[0]}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-gray-100 text-gray-900 transition-all shadow-sm"
            title="Sign in with Google to sync all devices"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign In</span>
          </button>
        )}

        {/* Fast QR Sync Button */}
        <button
          onClick={onOpenDeviceSync}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[#1c202c] hover:bg-[#252a3a] text-cyan-300 border border-cyan-500/30 transition-colors"
          title="1-Click Fast Device Sync (QR Code)"
        >
          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">QR Sync</span>
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
