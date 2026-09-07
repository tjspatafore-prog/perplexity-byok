"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Key,
  Shield,
  Cloud,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  ExternalLink,
  QrCode,
  LogOut,
  Sparkles,
  Database,
} from "lucide-react";
import { AppSettings } from "@/lib/types";
import {
  getSupabaseConfig,
  saveManualSupabaseCredentials,
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  getSessionUser,
  uploadEncryptedVault,
  downloadEncryptedVault,
} from "@/lib/sync/supabase";
import { encryptVaultData, decryptVaultData } from "@/lib/crypto/vault";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenDeviceSync: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenDeviceSync,
}) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "setup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual Supabase Config State
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  const checkAuth = async () => {
    const config = getSupabaseConfig();
    setIsConfigured(config.isConfigured);
    setSupabaseUrl(config.url);
    setSupabaseAnonKey(config.anonKey);

    if (config.isConfigured) {
      try {
        const user = await getSessionUser();
        setCurrentUser(user);
      } catch (e) {
        // Not signed in
      }
    }
  };

  if (!isOpen) return null;

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) return;
    saveManualSupabaseCredentials(supabaseUrl, supabaseAnonKey);
    setIsConfigured(true);
    setStatusMessage("Supabase configuration saved!");
    setActiveTab("signin");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const data = await signInWithEmail(email, password);
      const user = data.user;
      setCurrentUser(user);

      // Download encrypted vault
      if (user?.id) {
        setStatusMessage("Signed in! Decrypting your cloud vault...");
        const cloudVault = await downloadEncryptedVault(user.id);
        if (cloudVault) {
          const decrypted = await decryptVaultData<Partial<AppSettings>>(cloudVault, password);
          onUpdateSettings(decrypted);
          setStatusMessage("Cloud Vault restored! All keys and Super Agents synced.");
        } else {
          // Upload current local state as first vault
          const payload = {
            keys: settings.keys,
            customAgents: settings.customAgents || [],
            defaultModel: settings.defaultModel,
            defaultFocusMode: settings.defaultFocusMode,
            swarmRoster: settings.swarmRoster,
          };
          const encrypted = await encryptVaultData(payload, password);
          await uploadEncryptedVault(user.id, encrypted);
          setStatusMessage("Account connected! Cloud vault initialized.");
        }
      }

      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      console.error("Sign In Error:", err);
      setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const data = await signUpWithEmail(email, password);
      const user = data.user;
      setCurrentUser(user);

      // Encrypt and upload initial vault
      if (user?.id) {
        const payload = {
          keys: settings.keys,
          customAgents: settings.customAgents || [],
          defaultModel: settings.defaultModel,
          defaultFocusMode: settings.defaultFocusMode,
          swarmRoster: settings.swarmRoster,
        };
        const encrypted = await encryptVaultData(payload, password);
        await uploadEncryptedVault(user.id, encrypted);
      }

      setStatusMessage("Account created successfully! Your encrypted vault is synced.");
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      console.error("Sign Up Error:", err);
      setErrorMessage(err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setStatusMessage("Signed out.");
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleManualSyncNow = async () => {
    if (!currentUser?.id || !password) {
      setErrorMessage("Please enter your password to re-encrypt and sync your vault.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        keys: settings.keys,
        customAgents: settings.customAgents || [],
        defaultModel: settings.defaultModel,
        defaultFocusMode: settings.defaultFocusMode,
        swarmRoster: settings.swarmRoster,
      };
      const encrypted = await encryptVaultData(payload, password);
      await uploadEncryptedVault(currentUser.id, encrypted);
      setStatusMessage("Cloud Vault updated with your latest keys & agents!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sync vault.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#141620] border border-[#272c3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232734] bg-[#181a24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Account & Cloud Vault Sync</h3>
              <p className="text-xs text-gray-400">Zero-Knowledge cross-device synchronization</p>
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

        {/* Tab Navigation (when not logged in and configured) */}
        {!currentUser && isConfigured && (
          <div className="flex border-b border-[#232734] bg-[#12141c] text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === "signin"
                  ? "border-purple-400 text-purple-300 bg-purple-500/5"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === "signup"
                  ? "border-purple-400 text-purple-300 bg-purple-500/5"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-300">
          {/* Status / Error alert */}
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

          {/* Quick QR Fast Sync Banner */}
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <QrCode className="w-4 h-4" />
                <span>Want to sync to phone right now?</span>
              </div>
              <div className="text-[11px] text-gray-400">
                Transfer keys & agents in 1 second using the fast QR code scanner.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDeviceSync();
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shrink-0 transition-colors"
            >
              Fast QR Sync
            </button>
          </div>

          {/* LOGGED IN VIEW */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1a1d28] border border-[#262b3a] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                      {currentUser.email?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{currentUser.email}</div>
                      <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Account Active & Synced
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Password for re-encrypt sync */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[#161822] border border-[#242838]">
                <label className="font-semibold text-white flex items-center justify-between">
                  <span>Sync Latest Keys & Settings</span>
                  <span className="text-[10px] text-gray-400">Required for zero-knowledge re-encryption</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password..."
                    className="flex-1 bg-[#12141c] border border-[#292f42] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleManualSyncNow}
                    disabled={isLoading || !password}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sync Now"}
                  </button>
                </div>
              </div>
            </div>
          ) : !isConfigured ? (
            /* DATABASE NOT CONFIGURED GUIDE */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#181a24] border border-[#262c3e] space-y-3">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Cloud Database Configuration</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  To enable universal account login across all your devices, provide your free Supabase credentials below or add them to your Vercel Environment Variables (<code className="text-gray-200">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="text-gray-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>).
                </p>

                <form onSubmit={handleSaveSupabaseConfig} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-gray-300 font-medium">Supabase Project URL</label>
                    <input
                      type="text"
                      required
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full bg-[#12141c] border border-[#292f42] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-300 font-medium">Supabase Anon Key</label>
                    <input
                      type="text"
                      required
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                      className="w-full bg-[#12141c] border border-[#292f42] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors"
                  >
                    Save & Activate Cloud Sync
                  </button>
                </form>

                {/* SQL Table Creation Helper */}
                <div className="p-3 rounded-lg bg-[#12141c] border border-[#222634] space-y-1 mt-2">
                  <div className="text-[10px] text-gray-400 font-mono">
                    Supabase SQL (Run once in Supabase SQL Editor):
                  </div>
                  <pre className="text-[10px] text-purple-300 font-mono overflow-x-auto whitespace-pre">
{`create table if not exists user_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table user_vaults enable row level security;
create policy "Users manage own vault" on user_vaults for all using (auth.uid() = user_id);`}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            /* EMAIL/PASSWORD SIGN IN OR SIGN UP */
            <form onSubmit={activeTab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-white">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-[#181a24] border border-[#282d3e] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-white">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (used for zero-knowledge vault encryption)"
                  className="w-full bg-[#181a24] border border-[#282d3e] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-xs"
                />
                <p className="text-[10px] text-gray-500">
                  Your password derives the client-side AES-GCM 256 encryption key. Do not forget it.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-purple-600/20 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{activeTab === "signin" ? "Sign In & Sync Vault" : "Create Account & Sync Vault"}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 pt-2 text-[11px] text-gray-500 border-t border-[#1e2230]">
            <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Zero-Knowledge AES-GCM 256. API keys are decrypted exclusively in your browser.</span>
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
