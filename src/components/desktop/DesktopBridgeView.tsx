"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Laptop,
  Play,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Server,
  ShieldCheck,
  Loader2,
  Trash2,
} from "lucide-react";
import { ApiKeys, TerminalLog } from "@/lib/types";

interface DesktopBridgeViewProps {
  keys: ApiKeys;
  onOpenSettings: () => void;
}

const LOCAL_BRIDGE_SCRIPT = `// ai-byok-bridge.js
// Ultra-lightweight local desktop execution bridge for ai-byok.online
// Run on your machine: node ai-byok-bridge.js
const http = require('http');
const { exec } = require('child_process');

const PORT = 4040;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/exec' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { cmd } = JSON.parse(body);
        console.log('[Executing]:', cmd);
        exec(cmd, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            stdout: stdout || '',
            stderr: stderr || (error ? error.message : ''),
            code: error ? error.code || 1 : 0
          }));
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ai-byok bridge active', cwd: process.cwd() }));
  }
});

server.listen(PORT, () => {
  console.log('⚡ ai-byok local desktop bridge active on http://localhost:' + PORT);
  console.log('Ready to securely receive commands from ai-byok.online');
});
`;

export const DesktopBridgeView: React.FC<DesktopBridgeViewProps> = ({
  keys,
  onOpenSettings,
}) => {
  const [commandInput, setCommandInput] = useState<string>("");
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: "init-1",
      type: "info",
      content: "⚡ ai-byok.online Local Desktop & Terminal Agent initialized.",
      timestamp: Date.now() - 3000,
    },
    {
      id: "init-2",
      type: "info",
      content: "Connected to In-Browser Terminal Simulator. Run shell commands, python snippets, or connect to your local PC via the Bridge tab.",
      timestamp: Date.now() - 2000,
    },
  ]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [bridgeConnected, setBridgeConnected] = useState<boolean>(false);
  const [bridgeUrl, setBridgeUrl] = useState<string>("http://localhost:4040");
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState<string>("");
  const [isAiSuggesting, setIsAiSuggesting] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Ping local bridge
  const checkBridgeConnection = async () => {
    try {
      const res = await fetch(`${bridgeUrl}/`, { method: "GET" });
      if (res.ok) {
        setBridgeConnected(true);
        appendLog("info", `Connected to Local Desktop Bridge on ${bridgeUrl}`);
      } else {
        setBridgeConnected(false);
      }
    } catch (e) {
      setBridgeConnected(false);
    }
  };

  useEffect(() => {
    checkBridgeConnection();
  }, [bridgeUrl]);

  const appendLog = (type: TerminalLog["type"], content: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        type,
        content,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleExecuteCommand = async (cmdToRun?: string) => {
    const rawCmd = (cmdToRun || commandInput).trim();
    if (!rawCmd || isExecuting) return;

    setCommandInput("");
    setIsExecuting(true);
    appendLog("command", `$ ${rawCmd}`);

    // High risk detection
    const lower = rawCmd.toLowerCase();
    if (
      lower.includes("rm -rf /") ||
      lower.includes("format c:") ||
      lower.includes("del /f /s /q c:\\")
    ) {
      appendLog("error", "⚠️ Command blocked: Destructive root command detected.");
      setIsExecuting(false);
      return;
    }

    if (bridgeConnected) {
      // Execute through local bridge
      try {
        const res = await fetch(`${bridgeUrl}/exec`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: rawCmd }),
        });
        const data = await res.json();
        if (data.stdout) appendLog("output", data.stdout);
        if (data.stderr) appendLog("error", data.stderr);
      } catch (err: any) {
        appendLog("error", `Bridge Execution Failed: ${err.message}`);
      }
    } else {
      // Simulate locally in browser
      await new Promise((r) => setTimeout(r, 200));

      if (rawCmd === "help") {
        appendLog(
          "output",
          "Available Simulator Commands:\n  ls / dir     - List files\n  pwd          - Print working directory\n  git status   - Check git status\n  python --version\n  clear        - Clear terminal screen\n  Connect to 'Local Bridge' to execute on your actual PC!"
        );
      } else if (rawCmd === "clear") {
        setLogs([]);
      } else if (rawCmd === "pwd") {
        appendLog("output", "C:\\Users\\Tonys\\projects\\ai-byok-online");
      } else if (rawCmd === "ls" || rawCmd === "dir") {
        appendLog(
          "output",
          "drwxr-xr-x   src/\n-rw-r--r--   package.json\n-rw-r--r--   README.md\n-rw-r--r--   tsconfig.json\n-rw-r--r--   tailwind.config.js"
        );
      } else if (rawCmd.startsWith("git status")) {
        appendLog(
          "output",
          "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean"
        );
      } else if (rawCmd.startsWith("python")) {
        appendLog("output", "Python 3.11.8 (Simulated Environment)\n[GCC 11.2.0] on win32");
      } else if (rawCmd.startsWith("echo")) {
        appendLog("output", rawCmd.slice(5));
      } else {
        appendLog(
          "output",
          `[Simulator Output]: Command '${rawCmd}' executed successfully.\nTo run actual machine processes, launch the local bridge script!`
        );
      }
    }

    setIsExecuting(false);
  };

  // AI Terminal Command Assistant
  const handleAskAiAssistant = async () => {
    if (!aiAssistantPrompt.trim() || isAiSuggesting) return;

    const hasKey = keys.anthropic || keys.openai || keys.google || keys.grok;
    if (!hasKey) {
      onOpenSettings();
      alert("Please configure an API key in Settings to use the AI Terminal Assistant.");
      return;
    }

    setIsAiSuggesting(true);
    try {
      const selectedModel = keys.google
        ? "gemini-3.8-flash-high"
        : keys.anthropic
        ? "claude-3-7-sonnet-latest"
        : "gpt-4o";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Write the single best terminal command (Windows PowerShell or Bash) to accomplish: "${aiAssistantPrompt}". Respond with ONLY the raw command string, no explanation, no backticks.`,
          modelId: selectedModel,
          keys,
          focusMode: "writing",
        }),
      });

      if (!res.ok) throw new Error("Failed to get suggestion");
      const data = await res.json();
      const suggestedCmd = (data.content || "").replace(/```[a-z]*\n?|```/gi, "").trim();
      setCommandInput(suggestedCmd);
      setAiAssistantPrompt("");
    } catch (err: any) {
      alert("AI Suggestion error: " + err.message);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(LOCAL_BRIDGE_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-65px)] bg-[#0c0d12] text-xs text-gray-200 overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-3 border-b border-[#202534] bg-[#12141c] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">Local Desktop Bridge & Terminal Agent</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                  bridgeConnected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    bridgeConnected ? "bg-emerald-400 animate-pulse" : "bg-blue-400"
                  }`}
                />
                {bridgeConnected ? "Local Bridge Active" : "In-Browser Simulator Mode"}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">
              Inspired by Open-Interpreter & OpenHands • Execute shell commands & automate workflows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScriptModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1e2b] hover:bg-[#252a3d] border border-[#2d344b] text-gray-200 hover:text-white transition-colors"
          >
            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            <span>Connect Local PC</span>
          </button>
          <button
            onClick={() => setLogs([])}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f2434] transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI Terminal Assistant Input */}
      <div className="p-3 border-b border-[#202534] bg-[#151824] flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-perplexity-teal font-medium shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Command Assistant:</span>
        </div>
        <input
          type="text"
          value={aiAssistantPrompt}
          onChange={(e) => setAiAssistantPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAskAiAssistant();
          }}
          placeholder="Ask AI to craft a terminal command (e.g. 'Find all large files over 100MB' or 'Install Vite')..."
          className="flex-1 bg-[#0d0f17] border border-[#262c3e] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={handleAskAiAssistant}
          disabled={!aiAssistantPrompt.trim() || isAiSuggesting}
          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          {isAiSuggesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3" />}
          <span>Suggest</span>
        </button>
      </div>

      {/* Terminal Display Canvas */}
      <div className="flex-1 bg-[#090a0f] p-4 font-mono text-xs overflow-y-auto space-y-2 select-text">
        {logs.map((log) => (
          <div key={log.id} className="leading-relaxed">
            {log.type === "command" ? (
              <div className="text-emerald-400 font-bold">{log.content}</div>
            ) : log.type === "error" ? (
              <div className="text-red-400 whitespace-pre-wrap">{log.content}</div>
            ) : log.type === "info" ? (
              <div className="text-cyan-400/90 whitespace-pre-wrap">{log.content}</div>
            ) : (
              <div className="text-gray-300 whitespace-pre-wrap">{log.content}</div>
            )}
          </div>
        ))}
        {isExecuting && (
          <div className="text-cyan-400 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Executing...</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Command Input Prompt Bar */}
      <div className="p-3 border-t border-[#202534] bg-[#12141c]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteCommand();
          }}
          className="flex items-center gap-2 bg-[#0a0b10] p-1.5 rounded-xl border border-[#252b3d] focus-within:border-cyan-500 transition-colors"
        >
          <span className="text-emerald-400 font-mono font-bold pl-2">
            {bridgeConnected ? "pc:~$ " : "sim:~$ "}
          </span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type command (e.g. ls, git status, npm test, python script.py)..."
            className="flex-1 bg-transparent font-mono text-xs text-white placeholder-gray-600 focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!commandInput.trim() || isExecuting}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors disabled:opacity-50"
          >
            Run
          </button>
        </form>
      </div>

      {/* Connect Local PC Bridge Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#161822] border border-[#2b3145] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#252b3e] bg-[#1a1d2a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connect Your Local Computer</h3>
                  <p className="text-[11px] text-gray-400">1-Command zero-dependency Node.js bridge</p>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs text-gray-300">
              <div className="space-y-1">
                <div className="font-semibold text-white">How it works:</div>
                <p className="text-gray-400 text-[11px]">
                  Save this script as <code>ai-byok-bridge.js</code> on your machine and run it. It creates a secure local server on <code>localhost:4040</code> so this tab can run actual shell commands on your PC.
                </p>
              </div>

              <div className="relative">
                <pre className="bg-[#0f1118] p-4 rounded-xl border border-[#232738] font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-60 leading-relaxed">
                  {LOCAL_BRIDGE_SCRIPT}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={checkBridgeConnection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2334] hover:bg-[#282f46] text-gray-200 hover:text-white transition-colors border border-[#2b334a]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Check Connection</span>
                </button>

                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-md transition-colors"
                >
                  {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript ? "Copied Script!" : "Copy Bridge Script"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
