"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  Code2,
} from "lucide-react";

interface SandboxPreviewProps {
  code: string;
  isStreaming?: boolean;
  onAskFix?: (errorMessage: string) => void;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export const SandboxPreview: React.FC<SandboxPreviewProps> = ({
  code,
  isStreaming = false,
  onAskFix,
}) => {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [key, setKey] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for errors and console messages from the sandboxed iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "SANDBOX_ERROR") {
        setError(e.data.message);
      } else if (e.data && e.data.type === "SANDBOX_LOG") {
        setLogs((prev) => [...prev.slice(-19), e.data.message]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Clear errors on fresh code
  useEffect(() => {
    setError(null);
  }, [code]);

  const handleRefresh = () => {
    setError(null);
    setLogs([]);
    setKey((prev) => prev + 1);
  };

  const handleOpenNewTab = () => {
    const htmlContent = generateDocumentHtml(code);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const generateDocumentHtml = (sourceCode: string): string => {
    if (!sourceCode.trim()) {
      return `<!DOCTYPE html><html><body style="background:#0f1117;color:#94a3b8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><p>Waiting for code to generate...</p></body></html>`;
    }

    const isFullHtml = sourceCode.trim().toLowerCase().startsWith("<!doctype") ||
                       sourceCode.trim().toLowerCase().startsWith("<html");

    if (isFullHtml) {
      return sourceCode;
    }

    // Wrap React/JSX or HTML fragment into a complete self-executing environment
    const safeCode = sourceCode.replace(/<\/script>/gi, "<\\/script>");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0fdfa',
              500: '#14b8a6',
              600: '#0d9488',
            }
          }
        }
      }
    }
  </script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone@7.24.0/babel.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #0f1117;
      color: #f1f5f9;
      min-height: 100vh;
    }
    /* Custom scrollbars */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    // Capture runtime exceptions and communicate back to parent sandbox
    window.onerror = function(msg, url, line, col, err) {
      window.parent.postMessage({
        type: 'SANDBOX_ERROR',
        message: msg + ' (Line ' + line + ')'
      }, '*');
      return false;
    };

    // Forward console logs
    const origLog = console.log;
    console.log = function(...args) {
      origLog.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'SANDBOX_LOG',
          message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }, '*');
      } catch(e) {}
    };
  </script>

  <script type="text/babel">
    try {
      const { useState, useEffect, useMemo, useRef, useCallback } = React;
      
      ${safeCode}

      // Auto-trigger Lucide icon replacement after DOM mounts
      if (window.lucide && window.lucide.createIcons) {
        setTimeout(() => window.lucide.createIcons(), 100);
      }
    } catch (err) {
      window.parent.postMessage({
        type: 'SANDBOX_ERROR',
        message: err.message
      }, '*');
    }
  </script>
</body>
</html>`;
  };

  const getDeviceDimensions = () => {
    switch (device) {
      case "mobile":
        return "w-[375px] h-[667px] rounded-3xl border-[6px] border-[#2c3038] shadow-2xl my-auto";
      case "tablet":
        return "w-[768px] h-[90%] rounded-2xl border-4 border-[#2c3038] shadow-xl my-auto";
      case "desktop":
      default:
        return "w-full h-full rounded-none border-0";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#12141a] rounded-xl border border-[#232732] overflow-hidden">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#181a22] border-b border-[#232732] text-xs">
        {/* Device Switcher */}
        <div className="flex items-center bg-[#101218] rounded-lg p-0.5 border border-[#242834]">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              device === "desktop"
                ? "bg-[#252a38] text-cyan-300 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("tablet")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              device === "tablet"
                ? "bg-[#252a38] text-cyan-300 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
              device === "mobile"
                ? "bg-[#252a38] text-cyan-300 font-semibold"
                : "text-gray-400 hover:text-gray-200"
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Compiling code...
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              Interactive Live Sandbox
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-[#202430] hover:bg-[#2a3040] text-gray-300 hover:text-white transition-colors"
            title="Refresh Sandbox"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#202430] hover:bg-[#2a3040] text-gray-300 hover:text-white transition-colors text-[11px]"
            title="Open in Full Window / New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Open New Tab</span>
          </button>
        </div>
      </div>

      {/* Error Alert Bar (Self-Healing prompt trigger) */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-xs text-rose-300 animate-fadeIn">
          <div className="flex items-center gap-2 overflow-hidden">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate font-mono">{error}</span>
          </div>
          {onAskFix && (
            <button
              type="button"
              onClick={() => onAskFix(error)}
              className="ml-3 px-2.5 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-semibold shrink-0 transition-colors"
            >
              Auto-Fix with AI
            </button>
          )}
        </div>
      )}

      {/* Main Sandbox Canvas */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto bg-[#0a0b0e]">
        <iframe
          key={key}
          ref={iframeRef}
          srcDoc={generateDocumentHtml(code)}
          title="Sandbox Preview"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          className={`transition-all duration-300 bg-white ${getDeviceDimensions()}`}
        />
      </div>
    </div>
  );
};
