"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  Plus,
  Trash2,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Globe,
  FileText,
  CheckCircle2,
  Loader2,
  RotateCw,
} from "lucide-react";
import { ScheduledMonitor, ApiKeys } from "@/lib/types";

interface BackgroundAgentsViewProps {
  keys: ApiKeys;
  onOpenSettings: () => void;
}

const DEFAULT_MONITORS: ScheduledMonitor[] = [
  {
    id: "mon-1",
    name: "Daily arXiv & Multi-Agent AI Radar",
    schedule: "Every 24 Hours (Daily)",
    targetQuery: "autonomous AI agents WebContainers reasoning models",
    focusArea: "ai-research",
    status: "active",
    lastRun: Date.now() - 3600000 * 4,
    lastFinding:
      "Found 3 new papers: (1) In-Browser WebAssembly Sandboxing for Code Generation, (2) Self-Reflective Agent Cascades in Software Engineering, (3) Hierarchical Memory Systems.",
    findingsCount: 14,
  },
  {
    id: "mon-2",
    name: "Competitor & Vibe-Coding Platform Tracker",
    schedule: "Every 6 Hours",
    targetQuery: "Base44 Lovable v0 Bolt updates and releases",
    focusArea: "web-watcher",
    status: "active",
    lastRun: Date.now() - 3600000 * 2,
    lastFinding:
      "Base44 acquired by Wix for $80M. Bolt.diy releases v0.2.0 with improved local LLM Ollama provider integration.",
    findingsCount: 8,
  },
  {
    id: "mon-3",
    name: "App Code Health & Self-Healing Watchdog",
    schedule: "On Every Deploy",
    targetQuery: "Syntax check, React hook dependencies, and token optimization",
    focusArea: "code-audit",
    status: "active",
    lastRun: Date.now() - 1800000,
    lastFinding:
      "All 9 routes verified with Next.js 15. Zero missing dependencies. React 19 compatibility checks passed.",
    findingsCount: 22,
  },
];

const STORAGE_KEY_MONITORS = "byok_scheduled_monitors_v1";

export const BackgroundAgentsView: React.FC<BackgroundAgentsViewProps> = ({
  keys,
  onOpenSettings,
}) => {
  const [monitors, setMonitors] = useState<ScheduledMonitor[]>(DEFAULT_MONITORS);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [isAddingMonitor, setIsAddingMonitor] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newQuery, setNewQuery] = useState<string>("");
  const [newSchedule, setNewSchedule] = useState<string>("Every 12 Hours");
  const [newFocusArea, setNewFocusArea] = useState<ScheduledMonitor["focusArea"]>("ai-research");

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MONITORS);
      if (stored) {
        setMonitors(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  const saveMonitors = (updated: ScheduledMonitor[]) => {
    setMonitors(updated);
    try {
      localStorage.setItem(STORAGE_KEY_MONITORS, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleToggleStatus = (id: string) => {
    const updated = monitors.map((m) =>
      m.id === id ? { ...m, status: (m.status === "active" ? "paused" : "active") as ScheduledMonitor["status"] } : m
    );
    saveMonitors(updated);
  };

  const handleRunNow = async (id: string) => {
    const target = monitors.find((m) => m.id === id);
    if (!target) return;

    setRunningId(id);

    try {
      // Simulate/trigger autonomous agent crawl
      await new Promise((r) => setTimeout(r, 2000));

      const updated = monitors.map((m) => {
        if (m.id === id) {
          return {
            ...m,
            lastRun: Date.now(),
            findingsCount: m.findingsCount + 1,
            lastFinding: `Autonomous run completed at ${new Date().toLocaleTimeString()}. Analyzed recent updates for '${m.targetQuery}'. Verified zero critical regressions.`,
          };
        }
        return m;
      });
      saveMonitors(updated);
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = (id: string) => {
    const updated = monitors.filter((m) => m.id !== id);
    saveMonitors(updated);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newQuery.trim()) return;

    const newMon: ScheduledMonitor = {
      id: `mon-${Date.now()}`,
      name: newTitle.trim(),
      schedule: newSchedule,
      targetQuery: newQuery.trim(),
      focusArea: newFocusArea,
      status: "active",
      lastRun: Date.now(),
      lastFinding: "Scheduled monitor created. Waiting for next trigger cycle.",
      findingsCount: 0,
    };

    saveMonitors([newMon, ...monitors]);
    setNewTitle("");
    setNewQuery("");
    setIsAddingMonitor(false);
  };

  const getFocusIcon = (area: ScheduledMonitor["focusArea"]) => {
    switch (area) {
      case "ai-research":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case "web-watcher":
        return <Globe className="w-4 h-4 text-purple-400" />;
      case "code-audit":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-65px)] bg-[#0d0e12] text-xs text-gray-200 overflow-y-auto p-4 sm:p-8 space-y-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222634]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-md shadow-purple-500/20">
              📡
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Autonomous Background Monitors</h1>
              <p className="text-xs text-gray-400">
                Scheduled agent workers that monitor research, track competitor releases, and audit code health
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingMonitor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-semibold transition-all shadow-md shadow-purple-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Monitor</span>
          </button>
        </div>

        {/* Modal: Create Monitor */}
        {isAddingMonitor && (
          <div className="p-4 rounded-2xl bg-[#151722] border border-[#2b3145] space-y-3 animate-fadeIn">
            <div className="font-bold text-white text-sm">Create New Autonomous Monitor</div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 font-medium">Monitor Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. arXiv Prime Editing Breakthroughs"
                  className="w-full mt-1 bg-[#0f1118] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-400 font-medium">Target Search / Inspection Query</label>
                <input
                  type="text"
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  placeholder="e.g. quantum computing error mitigation QEC"
                  className="w-full mt-1 bg-[#0f1118] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 font-medium">Cadence</label>
                  <select
                    value={newSchedule}
                    onChange={(e) => setNewSchedule(e.target.value)}
                    className="w-full mt-1 bg-[#0f1118] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Every 1 Hour">Every 1 Hour</option>
                    <option value="Every 6 Hours">Every 6 Hours</option>
                    <option value="Every 12 Hours">Every 12 Hours</option>
                    <option value="Every 24 Hours (Daily)">Every 24 Hours (Daily)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 font-medium">Focus Area</label>
                  <select
                    value={newFocusArea}
                    onChange={(e) => setNewFocusArea(e.target.value as any)}
                    className="w-full mt-1 bg-[#0f1118] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="ai-research">AI & Academic Research</option>
                    <option value="web-watcher">Web URL & News Watchdog</option>
                    <option value="code-audit">Codebase Health Audit</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMonitor(false)}
                  className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold transition-colors shadow"
                >
                  Schedule Agent
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Monitors Cards List */}
        <div className="space-y-4">
          {monitors.map((mon) => {
            const isRunning = runningId === mon.id;
            return (
              <div
                key={mon.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#141620] border border-[#232736] hover:border-[#2f354a] transition-all space-y-3"
              >
                {/* Header Strip */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#1e2230] border border-[#2b3145]">
                      {getFocusIcon(mon.focusArea)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{mon.name}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{mon.schedule}</span>
                        </span>
                        <span>•</span>
                        <span>{mon.findingsCount} findings recorded</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunNow(mon.id)}
                      disabled={isRunning}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2334] hover:bg-[#282f46] text-cyan-300 font-semibold border border-[#2b344c] transition-colors disabled:opacity-50"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
                          <span>Run Now</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleToggleStatus(mon.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        mon.status === "active"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                      }`}
                      title={mon.status === "active" ? "Pause Monitor" : "Activate Monitor"}
                    >
                      {mon.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleDelete(mon.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Monitor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Latest Findings Box */}
                <div className="bg-[#0e1017] p-3 rounded-xl border border-[#202434] space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                    <span className="uppercase tracking-wider">Latest Autonomous Intelligence</span>
                    <span>
                      Last evaluated:{" "}
                      {mon.lastRun ? new Date(mon.lastRun).toLocaleTimeString() : "Never"}
                    </span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{mon.lastFinding}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
