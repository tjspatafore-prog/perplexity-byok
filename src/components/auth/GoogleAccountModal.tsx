"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  QrCode,
  LogOut,
  RefreshCw,
  Shield,
  Smartphone,
  Cloud,
} from "lucide-react";
import { AppSettings } from "@/lib/types";
import {
  GoogleUserProfile,
  getGoogleUserSession,
  clearGoogleUserSession,
  getStoredGoogleClientId,
  saveStoredGoogleClientId,
  triggerGoogleSignIn,
  syncSettingsCloud,
  fetchSettingsCloud,
  syncSettingsToGoogleDrive,
  fetchSettingsFromGoogleDrive,
} from "@/lib/sync/google-sync";

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenDeviceSync: () => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenDeviceSync,
}) => {
  const [user, setUser] = useState<GoogleUserProfile | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUser(getGoogleUserSession());
      setClientId(getStoredGoogleClientId());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setErrorMessage(null);
    setStatusMessage(null);

    const activeClientId = clientId.trim() || getStoredGoogleClientId();
    if (!activeClientId) {
      setErrorMessage("Please enter your Google OAuth Client ID below before signing in.");
      return;
    }

    saveStoredGoogleClientId(activeClientId);
    setIsLoading(true);

    triggerGoogleSignIn(
      activeClientId,
      async (authenticatedUser) => {
        setUser(authenticatedUser);
        setIsLoading(false);
        setStatusMessage(`Signed in as ${authenticatedUser.email}! Syncing your vault...`);

        // Check for existing cloud settings
        if (authenticatedUser.id) {
          const remoteSettings = await fetchSettingsCloud(authenticatedUser);
          if (remoteSettings && remoteSettings.keys && Object.keys(remoteSettings.keys).length > 0) {
            onUpdateSettings(remoteSettings);
            setStatusMessage("Successfully synced your keys & agents from your account!");
          } else {
            // First time: upload local settings to cloud
            await syncSettingsCloud(authenticatedUser, settings);
            setStatusMessage("Your settings are now securely synced across your devices!");
          }
        }

        setTimeout(() => onClose(), 2200);
      },
      (error) => {
        setIsLoading(false);
        if (typeof error === "string" && (error.includes("access_denied") || error.includes("verification"))) {
          setErrorMessage(
            "Access Denied (Google Testing Mode): In your Google Cloud Console -> OAuth consent screen, scroll down to 'Test users' and add your Gmail address (or click 'Publish App')."
          );
        } else {
          setErrorMessage(error || "Google Sign-In was cancelled or failed.");
        }
      }
    );
  };

  const handleManualSync = async () => {
    if (!user?.accessToken) return;
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    const success = await syncSettingsToGoogleDrive(user.accessToken, settings);
    setIsLoading(false);

    if (success) {
      setStatusMessage("Synced successfully! All latest keys and Super Agents are saved to your Google Account.");
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setErrorMessage("Sync failed. Your Google login session may have expired. Please sign in again.");
    }
  };

  const handleSignOut = () => {
    clearGoogleUserSession();
    setUser(null);
    setStatusMessage("Signed out from Google Account.");
    setTimeout(() => setStatusMessage(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#141620] border border-[#272c3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232734] bg-[#181a24]">
          <div className="flex items-center gap-2.5">
            {/* Google Colorful G Icon */}
            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
              <svg className="w-full h-full" viewBox="0 0 24 24">
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
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Account Sync</h3>
              <p className="text-xs text-gray-400">Sync all devices with 1-click Google Sign-In</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-300">
          {/* Status / Error feedback */}
          {statusMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {user ? (
            /* SIGNED IN STATE */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1a1d28] border border-[#272c3d] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border border-white/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-base">
                      {user.name?.[0]?.toUpperCase() || "G"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate text-sm">{user.name}</div>
                    <div className="text-[11px] text-gray-400 truncate">{user.email}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Sync Status Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-emerald-300">
                  <Check className="w-4 h-4" />
                  <span>Cloud Sync Active</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Your API keys, custom Super Agents, and default preferences are connected to your Google account and automatically available on your phone, tablet, and computer.
                </p>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/20 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Sync Current Keys to Google Now</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* NOT SIGNED IN STATE */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-white">One Account, Every Device</h4>
                <p className="text-[11px] text-gray-400">
                  Sign in with Google to automatically carry your API keys and custom Super Agents anywhere.
                </p>
              </div>

              {/* Primary Sign In with Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>

              {/* OAuth Client ID input (if needed) */}
              <div className="pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-gray-400 font-medium text-[11px]">
                    Google OAuth Client ID
                  </label>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                  >
                    <span>Cloud Console</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    saveStoredGoogleClientId(e.target.value);
                  }}
                  placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                  className="w-full bg-[#181a24] border border-[#272c3d] rounded-xl px-3 py-2 text-white placeholder-gray-500 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-gray-500 leading-normal">
                  In Google Cloud Console, add <code className="text-gray-300">https://ai-byok.online</code> to Authorized JavaScript Origins.
                </p>
              </div>
            </div>
          )}

          {/* Quick QR Sync Option */}
          <div className="pt-3 border-t border-[#202432] flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Or sync to phone without signing in</span>
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDeviceSync();
              }}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Open QR Sync
            </button>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-500">
            <Shield className="w-3 h-3 text-blue-400 shrink-0" />
            <span>Zero third-party database. Data is stored directly inside your own Google Drive.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#232734] bg-[#181a24] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#202534] hover:bg-[#2b3144] text-gray-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
