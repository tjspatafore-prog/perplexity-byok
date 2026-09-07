"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  QrCode,
  Smartphone,
  Laptop,
  Copy,
  Check,
  Shield,
  KeyRound,
  Download,
  Upload,
  ArrowRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AppSettings, ApiKeys, SuperAgent } from "@/lib/types";
import {
  encryptVaultData,
  decryptVaultData,
  packSyncToken,
  unpackSyncToken,
} from "@/lib/crypto/vault";

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onImportSettings: (imported: Partial<AppSettings>) => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  settings,
  onImportSettings,
}) => {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [password, setPassword] = useState("1234");
  const [syncToken, setSyncToken] = useState<string>("");
  const [importToken, setImportToken] = useState("");
  const [importPassword, setImportPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate sync token whenever password changes or tab opens
  useEffect(() => {
    if (isOpen && activeTab === "export") {
      generateToken();
    }
  }, [isOpen, activeTab, password, settings]);

  if (!isOpen) return null;

  const generateToken = async () => {
    try {
      setIsLoading(true);
      const payloadToSync = {
        keys: settings.keys,
        customAgents: settings.customAgents || [],
        defaultModel: settings.defaultModel,
        defaultFocusMode: settings.defaultFocusMode,
        swarmRoster: settings.swarmRoster,
        modelAliases: settings.modelAliases,
      };

      const encrypted = await encryptVaultData(payloadToSync, password || "byok-default");
      const token = packSyncToken(encrypted);
      setSyncToken(token);
    } catch (err: any) {
      console.error("Token generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(syncToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!importToken.trim()) {
      setErrorMessage("Please paste the Sync Code from your other device.");
      return;
    }

    try {
      setIsLoading(true);
      const unpacked = unpackSyncToken(importToken);
      const decrypted = await decryptVaultData<Partial<AppSettings>>(
        unpacked,
        importPassword || "byok-default"
      );

      onImportSettings(decrypted);
      setStatusMessage("Vault successfully restored! All API keys and Super Agents have been transferred to this device.");
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error("Import error:", err);
      setErrorMessage("Decryption failed. Please verify that the Sync Code and Passphrase are correct.");
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
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cross-Device Fast Sync</h3>
              <p className="text-xs text-gray-400">Transfer your keys & agents between phone & laptop instantly</p>
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

        {/* Tab Switcher */}
        <div className="flex border-b border-[#232734] bg-[#12141c] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "export"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Send to Another Device</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === "import"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Receive on this Device</span>
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

          {activeTab === "export" ? (
            /* EXPORT / SEND TAB */
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-[#1a1d28] border border-[#262b3a] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Encryption Passphrase</div>
                  <div className="text-[11px] text-gray-400">Short PIN or password to unlock on your other device</div>
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-24 bg-[#12141c] border border-[#2c3244] rounded-lg px-2.5 py-1.5 text-center text-white font-mono focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-gray-900 shadow-inner max-w-[220px] mx-auto">
                {isLoading ? (
                  <Loader2 className="w-12 h-12 text-gray-500 animate-spin my-8" />
                ) : syncToken ? (
                  <QRCodeSVG
                    value={syncToken}
                    size={190}
                    level="L"
                    includeMargin={false}
                  />
                ) : null}
              </div>

              <div className="text-center space-y-1">
                <div className="font-semibold text-gray-200">Scan QR code with phone camera</div>
                <p className="text-[11px] text-gray-500">
                  Or copy the encrypted sync code below to paste on your other device:
                </p>
              </div>

              {/* Copy String */}
              <div className="relative">
                <textarea
                  readOnly
                  value={syncToken}
                  rows={2}
                  className="w-full bg-[#181a24] border border-[#272c3d] rounded-xl p-2.5 font-mono text-[10px] text-gray-400 focus:outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="absolute right-2.5 bottom-3.5 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* IMPORT / RECEIVE TAB */
            <form onSubmit={handleImportToken} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-white">Paste Sync Code</label>
                <textarea
                  required
                  rows={4}
                  value={importToken}
                  onChange={(e) => setImportToken(e.target.value)}
                  placeholder="Paste the encrypted sync code copied from your laptop or other device..."
                  className="w-full bg-[#181a24] border border-[#272c3d] rounded-xl p-3 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-white">Passphrase / PIN</label>
                <input
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  placeholder="Enter the passphrase you set on the other device"
                  className="w-full bg-[#181a24] border border-[#272c3d] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !importToken.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-md shadow-cyan-500/20 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Restore & Sync to This Device</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 pt-2 text-[11px] text-gray-500 border-t border-[#1e2230]">
            <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>End-to-End Client Encrypted (AES-GCM 256). Zero plaintext storage.</span>
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
