"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  FolderPlus,
  ExternalLink,
  Check,
  AlertCircle,
  Key,
  Shield,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Loader2,
} from "lucide-react";
import { GoogleWorkspaceSettings, UploadedDocument } from "@/lib/types";

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: GoogleWorkspaceSettings;
  onSaveSettings: (settings: GoogleWorkspaceSettings) => void;
  onImportDocument?: (doc: UploadedDocument) => void;
  exportContent?: { title: string; content: string };
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onImportDocument,
  exportContent,
}) => {
  const [clientId, setClientId] = useState(settings?.clientId || "");
  const [apiKey, setApiKey] = useState(settings?.apiKey || "");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(settings?.userEmail || null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings?.clientId) setClientId(settings.clientId);
    if (settings?.apiKey) setApiKey(settings.apiKey);
    if (settings?.userEmail) setUserEmail(settings.userEmail);
  }, [settings]);

  if (!isOpen) return null;

  const handleSaveCredentials = () => {
    onSaveSettings({
      clientId: clientId.trim(),
      apiKey: apiKey.trim(),
      isConnected: !!accessToken,
      userEmail: userEmail || undefined,
    });
    setStatusMessage("Credentials saved to local browser storage.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleConnectGoogle = () => {
    if (!clientId.trim()) {
      alert("Please provide your Google Cloud OAuth 2.0 Client ID first.");
      return;
    }

    setIsLoading(true);
    // Load Google Identity Services script dynamically if not present
    const loadGis = () => {
      if ((window as any).google?.accounts?.oauth2) {
        initTokenClient();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initTokenClient();
      script.onerror = () => {
        setIsLoading(false);
        alert("Failed to load Google Identity Services library. Please check your internet connection.");
      };
      document.body.appendChild(script);
    };

    const initTokenClient = () => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId.trim(),
          scope: "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents",
          callback: (response: any) => {
            setIsLoading(false);
            if (response.error) {
              alert(`Google Auth Error: ${response.error_description || response.error}`);
              return;
            }
            if (response.access_token) {
              setAccessToken(response.access_token);
              setUserEmail("Google Account Connected");
              onSaveSettings({
                clientId: clientId.trim(),
                apiKey: apiKey.trim(),
                isConnected: true,
                userEmail: "Connected",
              });
              setStatusMessage("Successfully connected to Google Workspace!");
              setTimeout(() => setStatusMessage(null), 3000);
            }
          },
        });
        client.requestAccessToken();
      } catch (err: any) {
        setIsLoading(false);
        alert(`Error initializing Google OAuth: ${err.message}`);
      }
    };

    loadGis();
  };

  const handleExportToGoogleDocs = async () => {
    if (!accessToken) {
      alert("Please connect your Google Account first.");
      return;
    }
    if (!exportContent?.content) {
      alert("No report or content available to export.");
      return;
    }

    setIsLoading(true);
    try {
      // Create blank Google Doc
      const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: exportContent.title || "AI Research Whitepaper",
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error?.message || "Failed to create Google Doc");
      }

      const docData = await createRes.json();
      const documentId = docData.documentId;

      // Insert content into the created Doc
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `${exportContent.title}\n\nGenerated via ai-byok.online\n\n${exportContent.content}`,
              },
            },
          ],
        }),
      });

      // Open new doc in new tab
      window.open(`https://docs.google.com/document/d/${documentId}/edit`, "_blank");
      setStatusMessage("Google Doc successfully created and opened in new tab!");
    } catch (err: any) {
      console.error("Google Docs Export Error:", err);
      alert(`Export Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-[#141620] border border-[#272c3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#232734] bg-[#181a24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Workspace Integration</h3>
              <p className="text-xs text-gray-400">Connect Google Drive, Docs & Sheets using BYOK OAuth</p>
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-300">
          {/* Status Message */}
          {statusMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-gray-300 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-blue-300">
              <Shield className="w-4 h-4" />
              <span>100% Client-Side Privacy (Zero Server Storage)</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              In accordance with our Bring-Your-Own-Key philosophy, your Google OAuth credentials and tokens remain exclusively inside your browser&apos;s local storage. No document contents or credentials pass through any third-party servers.
            </p>
          </div>

          {/* Credentials Setup */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-white flex items-center justify-between">
                <span>Google OAuth 2.0 Client ID</span>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-normal text-[11px]"
                >
                  <span>Google Cloud Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="e.g. 123456789-abcdefg.apps.googleusercontent.com"
                className="w-full bg-[#1c202c] border border-[#2b3042] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <p className="text-[10px] text-gray-500">
                In Google Cloud Console, add <code className="text-gray-300">https://ai-byok.online</code> to Authorized JavaScript Origins.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveCredentials}
                className="px-4 py-2 rounded-xl bg-[#202534] hover:bg-[#2b3144] border border-[#2b3144] text-white font-medium transition-colors"
              >
                Save Client ID
              </button>

              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isLoading || !clientId.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-semibold transition-all shadow-md ${
                  accessToken
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : accessToken ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Connected to Google</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions (Export to Google Docs) */}
          {exportContent && (
            <div className="pt-4 border-t border-[#232734] space-y-3">
              <h4 className="font-semibold text-white">Current Active Document</h4>
              <div className="p-3 rounded-xl bg-[#1a1d28] border border-[#262b3a] flex items-center justify-between gap-3">
                <div className="truncate">
                  <div className="font-medium text-white truncate">{exportContent.title}</div>
                  <div className="text-[10px] text-gray-400">{exportContent.content.length.toLocaleString()} characters ready to export</div>
                </div>

                <button
                  type="button"
                  onClick={handleExportToGoogleDocs}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shrink-0 transition-colors shadow-md shadow-blue-600/20"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Export to Docs</span>
                </button>
              </div>
            </div>
          )}
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
