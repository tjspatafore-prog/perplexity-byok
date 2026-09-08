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
  MousePointerClick,
} from "lucide-react";

export interface SelectedElementInfo {
  tag: string;
  text: string;
  className: string;
  id: string;
}

interface SandboxPreviewProps {
  code: string;
  isStreaming?: boolean;
  onAskFix?: (errorMessage: string) => void;
  onSelectElement?: (element: SelectedElementInfo) => void;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export const SandboxPreview: React.FC<SandboxPreviewProps> = ({
  code,
  isStreaming = false,
  onAskFix,
  onSelectElement,
}) => {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [key, setKey] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isInspectMode, setIsInspectMode] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for errors, console messages, and element inspection from the sandboxed iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === "SANDBOX_ERROR") {
        setError(e.data.message);
      } else if (e.data && e.data.type === "SANDBOX_LOG") {
        setLogs((prev) => [...prev.slice(-19), e.data.message]);
      } else if (e.data && e.data.type === "ELEMENT_SELECTED") {
        if (onSelectElement) {
          onSelectElement(e.data.element);
        }
        setIsInspectMode(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectElement]);

  // Clear errors on fresh code
  useEffect(() => {
    setError(null);
  }, [code]);

  // Post inspect mode status to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_INSPECT_MODE", active: isInspectMode },
        "*"
      );
    }
  }, [isInspectMode]);

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

    const isFullHtml =
      sourceCode.trim().toLowerCase().startsWith("<!doctype") ||
      sourceCode.trim().toLowerCase().startsWith("<html");

    if (isFullHtml) {
      return sourceCode;
    }

    // Wrap React/JSX into self-executing environment
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
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    window.__INSPECT_MODE__ = ${isInspectMode ? "true" : "false"};

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SET_INSPECT_MODE') {
        window.__INSPECT_MODE__ = !!e.data.active;
      }
    });

    document.addEventListener('mouseover', function(e) {
      if (!window.__INSPECT_MODE__) return;
      var target = e.target;
      if (!target || target.id === 'root') return;
      target.style.outline = '2px dashed #06b6d4';
      target.style.cursor = 'crosshair';
    });

    document.addEventListener('mouseout', function(e) {
      if (!window.__INSPECT_MODE__) return;
      var target = e.target;
      if (target) target.style.outline = '';
    });

    document.addEventListener('click', function(e) {
      if (!window.__INSPECT_MODE__) return;
      e.preventDefault();
      e.stopPropagation();
      var target = e.target;
      if (!target || target.id === 'root') return;
      var text = (target.innerText || target.textContent || '').trim().slice(0, 40);
      var tag = target.tagName.toLowerCase();
      var className = target.className || '';
      var id = target.id || '';
      target.style.outline = '';
      window.parent.postMessage({
        type: 'ELEMENT_SELECTED',
        element: { tag: tag, text: text, className: typeof className === 'string' ? className : '', id: id }
      }, '*');
    }, true);

    // Capture runtime exceptions
    window.onerror = function(msg, url, line, col, err) {
      window.parent.postMessage({
        type: 'SANDBOX_ERROR',
        message: msg + ' (Line ' + line + ')'
      }, '*');
      return false;
    };

    // Forward console logs
    var origLog = console.log;
    console.log = function() {
      var args = Array.prototype.slice.call(arguments);
      origLog.apply(console, args);
      try {
        window.parent.postMessage({
          type: 'SANDBOX_LOG',
          message: args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ')
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

        {/* Live Sandbox Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Interactive Sandbox</span>
        </div>

        {/* Visual Element Inspector & Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsInspectMode(!isInspectMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs ${
              isInspectMode
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/50 shadow-sm animate-pulse"
                : "text-gray-400 hover:text-gray-200 hover:bg-[#202432]"
            }`}
            title="Click to inspect any element in the preview and target an AI edit"
          >
            <MousePointerClick className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">
              {isInspectMode ? "Click Element to Edit" : "Inspect Element"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202432] transition-colors"
            title="Reload Sandbox"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleOpenNewTab}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202432] transition-colors"
            title="Open in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inspect Mode Active Notification Bar */}
      {isInspectMode && (
        <div className="bg-cyan-950/60 border-b border-cyan-800/40 px-3 py-1.5 flex items-center justify-between text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Hover and click any component in the preview to edit it with AI</span>
          </div>
          <button
            onClick={() => setIsInspectMode(false)}
            className="text-[11px] underline hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Frame Container */}
      <div className="flex-1 bg-[#0a0b0e] flex items-center justify-center overflow-auto p-2 relative">
        <iframe
          key={key}
          ref={iframeRef}
          srcDoc={generateDocumentHtml(code)}
          title="Sandbox Output"
          sandbox="allow-scripts allow-modals allow-same-origin"
          className={`transition-all bg-[#0f1117] ${getDeviceDimensions()}`}
        />

        {/* Runtime Error Overlay */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-950/90 backdrop-blur-md border border-red-500/50 rounded-xl p-3.5 shadow-2xl text-xs space-y-2 z-30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-red-300 font-semibold">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Runtime Error Detected</span>
              </div>
              {onAskFix && (
                <button
                  onClick={() => onAskFix(error)}
                  className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-xs shadow transition-colors shrink-0"
                >
                  ⚡ Auto-Fix with AI
                </button>
              )}
            </div>
            <div className="font-mono text-[11px] text-red-200/90 overflow-x-auto max-h-20 p-2 bg-black/40 rounded border border-red-500/20">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
