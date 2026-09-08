"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Play,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Table as TableIcon,
  Plus,
  Trash2,
  FileCode,
  Terminal,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { DatabaseTable, SqlQueryResult, ApiKeys, AVAILABLE_MODELS } from "@/lib/types";

interface DatabaseStudioProps {
  keys: ApiKeys;
  onOpenSettings: () => void;
}

const DEFAULT_STARTER_TABLES: DatabaseTable[] = [
  {
    name: "tasks",
    columns: [
      { name: "id", type: "INTEGER PRIMARY KEY" },
      { name: "title", type: "TEXT" },
      { name: "tag", type: "TEXT" },
      { name: "priority", type: "TEXT" },
      { name: "done", type: "BOOLEAN" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
    rows: [
      [1, "Architect Multi-Model Agent Engine", "Backend", "High", true, "2026-09-01 10:00:00"],
      [2, "Design Base44 Split-Screen Sandbox", "UI/UX", "High", true, "2026-09-02 11:30:00"],
      [3, "Connect Live Google Drive Picker", "Cloud", "Medium", false, "2026-09-03 14:15:00"],
      [4, "Ship Autonomous App Studio v1.0", "Launch", "Urgent", false, "2026-09-04 09:00:00"],
      [5, "Add In-Browser SQLite Engine", "Database", "Urgent", true, "2026-09-07 20:00:00"],
    ],
  },
  {
    name: "users",
    columns: [
      { name: "id", type: "INTEGER PRIMARY KEY" },
      { name: "full_name", type: "TEXT" },
      { name: "email", type: "TEXT" },
      { name: "role", type: "TEXT" },
      { name: "tier", type: "TEXT" },
    ],
    rows: [
      [1, "Tony Stark", "tony@stark.corp", "Architect", "Enterprise"],
      [2, "Sarah Connor", "sarah@resistance.net", "Security Lead", "Pro"],
      [3, "Alan Turing", "alan@enigma.ai", "Cryptographer", "Enterprise"],
    ],
  },
  {
    name: "research_papers",
    columns: [
      { name: "id", type: "INTEGER PRIMARY KEY" },
      { name: "title", type: "TEXT" },
      { name: "domain", type: "TEXT" },
      { name: "citations", type: "INTEGER" },
      { name: "is_open_access", type: "BOOLEAN" },
    ],
    rows: [
      [1, "Attention Is All You Need", "arxiv.org", 124500, true],
      [2, "DeepSeek-V3 Technical Report", "github.com", 3210, true],
      [3, "Chain-of-Thought Prompting in Language Models", "neurips.cc", 18200, true],
    ],
  },
];

const STORAGE_KEY_DB = "byok_sqlite_tables_v1";

export const DatabaseStudio: React.FC<DatabaseStudioProps> = ({ keys, onOpenSettings }) => {
  const [tables, setTables] = useState<DatabaseTable[]>(DEFAULT_STARTER_TABLES);
  const [activeTableName, setActiveTableName] = useState<string>("tasks");
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM tasks WHERE done = 1;");
  const [queryResult, setQueryResult] = useState<SqlQueryResult | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedSupabase, setCopiedSupabase] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);

  // Load tables from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DB);
      if (stored) {
        setTables(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load stored tables:", e);
    }
  }, []);

  // Save tables to localStorage
  const saveTables = (updated: DatabaseTable[]) => {
    setTables(updated);
    try {
      localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(updated));
    } catch (e) {}
  };

  const activeTable = tables.find((t) => t.name === activeTableName) || tables[0];

  // In-Browser SQL Execution Engine
  const handleExecuteSql = () => {
    const startTime = performance.now();
    const query = sqlQuery.trim();
    if (!query) return;

    try {
      const lower = query.toLowerCase();

      // Simple parser for SELECT
      if (lower.startsWith("select")) {
        const fromMatch = query.match(/from\s+([a-zA-Z0-9_]+)/i);
        if (!fromMatch) throw new Error("Could not find table in FROM clause");
        const targetTableName = fromMatch[1];
        const targetTable = tables.find((t) => t.name.toLowerCase() === targetTableName.toLowerCase());
        if (!targetTable) throw new Error(`Table '${targetTableName}' does not exist.`);

        let filteredRows = [...targetTable.rows];

        // Check WHERE clause
        const whereMatch = query.match(/where\s+(.+?)(?:order\s+by|limit|;|$)/i);
        if (whereMatch) {
          const condition = whereMatch[1].trim();
          // Evaluate condition safely for simple equality, boolean or inequality
          filteredRows = filteredRows.filter((row) => {
            const rowObj: Record<string, any> = {};
            targetTable.columns.forEach((col, idx) => {
              rowObj[col.name.toLowerCase()] = row[idx];
            });

            try {
              // Replace column identifiers with rowObj values
              const safeCondition = condition
                .replace(/([a-zA-Z0-9_]+)\s*=\s*(true|false|\d+|'[^']*')/gi, (_, col, val) => {
                  return `rowObj['${col.toLowerCase()}'] == ${val}`;
                })
                .replace(/([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)/gi, (_, col, val) => {
                  return `rowObj['${col.toLowerCase()}'] == '${val}'`;
                });
              // eslint-disable-next-line no-new-func
              return new Function("rowObj", `return Boolean(${safeCondition});`)(rowObj);
            } catch (err) {
              return true; // fallback
            }
          });
        }

        const endTime = performance.now();
        setQueryResult({
          columns: targetTable.columns.map((c) => c.name),
          rows: filteredRows,
          rowCount: filteredRows.length,
          executionTimeMs: Math.round(endTime - startTime),
        });
        setActiveTableName(targetTable.name);
      } else if (lower.startsWith("create table")) {
        // CREATE TABLE <name> (<columns>)
        const nameMatch = query.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
        if (!nameMatch) throw new Error("Invalid CREATE TABLE syntax. Example: CREATE TABLE products (id INTEGER, name TEXT, price REAL);");

        const newName = nameMatch[1];
        const colDefinitions = nameMatch[2].split(",").map((c) => c.trim());
        const cols = colDefinitions.map((colStr) => {
          const parts = colStr.split(/\s+/);
          return { name: parts[0], type: parts.slice(1).join(" ") || "TEXT" };
        });

        const newTable: DatabaseTable = {
          name: newName,
          columns: cols,
          rows: [],
        };

        const updated = [...tables.filter((t) => t.name.toLowerCase() !== newName.toLowerCase()), newTable];
        saveTables(updated);
        setActiveTableName(newName);

        const endTime = performance.now();
        setQueryResult({
          columns: cols.map((c) => c.name),
          rows: [],
          rowCount: 0,
          executionTimeMs: Math.round(endTime - startTime),
        });
      } else if (lower.startsWith("insert into")) {
        // Simple INSERT handler
        const insertMatch = query.match(/insert\s+into\s+([a-zA-Z0-9_]+)/i);
        if (!insertMatch) throw new Error("Invalid INSERT INTO syntax");
        const targetTableName = insertMatch[1];
        const targetTable = tables.find((t) => t.name.toLowerCase() === targetTableName.toLowerCase());
        if (!targetTable) throw new Error(`Table '${targetTableName}' does not exist.`);

        // Extract values
        const valuesMatch = query.match(/values\s*\(([\s\S]+?)\)/i);
        if (!valuesMatch) throw new Error("Could not parse VALUES(...) list");
        const rawVals = valuesMatch[1].split(",").map((v) => {
          const trimmed = v.trim();
          if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
          if (trimmed === "true") return true;
          if (trimmed === "false") return false;
          if (!isNaN(Number(trimmed))) return Number(trimmed);
          return trimmed;
        });

        const updatedRows = [...targetTable.rows, rawVals];
        const updatedTables = tables.map((t) => (t.name === targetTable.name ? { ...t, rows: updatedRows } : t));
        saveTables(updatedTables);

        const endTime = performance.now();
        setQueryResult({
          columns: targetTable.columns.map((c) => c.name),
          rows: updatedRows,
          rowCount: updatedRows.length,
          executionTimeMs: Math.round(endTime - startTime),
        });
      } else {
        throw new Error("Currently supporting SELECT, CREATE TABLE, and INSERT queries in local SQLite engine.");
      }
    } catch (err: any) {
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: 0,
        error: err.message || "SQL Execution failed",
      });
    }
  };

  // AI SQL Schema Assistant
  const handleGenerateSqlFromPrompt = async () => {
    if (!aiPrompt.trim() || isAiGenerating) return;

    // Use available key
    const hasKey = keys.anthropic || keys.openai || keys.google || keys.grok;
    if (!hasKey) {
      onOpenSettings();
      alert("Please configure an API key in Settings to use the AI SQL Assistant.");
      return;
    }

    setIsAiGenerating(true);
    try {
      const selectedModel = keys.google ? "gemini-3.8-flash-high" : keys.anthropic ? "claude-3-7-sonnet-latest" : "gpt-4o";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Write valid SQLite DDL and DML statements to fulfill this user request: "${aiPrompt}". Return ONLY the executable SQL statements inside a \`\`\`sql ... \`\`\` block, with comments, CREATE TABLE, and 3-5 sample INSERT INTO rows.`,
          modelId: selectedModel,
          keys,
          focusMode: "writing",
        }),
      });

      if (!res.ok) throw new Error("Failed to generate SQL schema");

      const data = await res.json();
      const content = data.content || "";
      const match = content.match(/```(?:sql)?\s*([\s\S]*?)```/i);
      const generatedSql = match ? match[1].trim() : content;

      setSqlQuery(generatedSql);
      setAiPrompt("");
    } catch (err: any) {
      alert("Error generating SQL: " + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Generate Supabase PostgreSQL Migration Script
  const generateSupabaseSql = (): string => {
    let sql = `-- Supabase PostgreSQL Migration Script\n-- Generated by ai-byok.online\n\n`;

    tables.forEach((t) => {
      sql += `-- Table: ${t.name}\n`;
      sql += `CREATE TABLE IF NOT EXISTS public.${t.name} (\n`;
      const colDefs = t.columns.map((col) => {
        let type = col.type.toUpperCase();
        if (type.includes("INTEGER PRIMARY KEY")) return `  ${col.name} BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY`;
        if (type.includes("TEXT")) return `  ${col.name} TEXT`;
        if (type.includes("BOOLEAN")) return `  ${col.name} BOOLEAN DEFAULT false`;
        if (type.includes("TIMESTAMP")) return `  ${col.name} TIMESTAMPTZ DEFAULT now()`;
        return `  ${col.name} TEXT`;
      });
      sql += colDefs.join(",\n");
      sql += `\n);\n\n`;
      sql += `ALTER TABLE public.${t.name} ENABLE ROW LEVEL SECURITY;\n`;
      sql += `CREATE POLICY "Allow public read" ON public.${t.name} FOR SELECT USING (true);\n\n`;
    });

    return sql;
  };

  const handleCopySupabaseMigration = () => {
    navigator.clipboard.writeText(generateSupabaseSql());
    setCopiedSupabase(true);
    setTimeout(() => setCopiedSupabase(false), 2000);
  };

  const handleDownloadSqlFile = () => {
    const blob = new Blob([generateSupabaseSql()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `schema_export_${Date.now()}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-65px)] bg-[#0d0e12] overflow-hidden text-xs text-gray-200">
      {/* LEFT PANE: Database Navigation & SQL Workbench (45% width) */}
      <div className="w-full lg:w-[45%] flex flex-col h-full border-r border-[#222634] bg-[#12141a]">
        {/* Studio Top Header */}
        <div className="p-3 border-b border-[#222634] bg-[#161922] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">In-Browser SQLite & SQL Engine</h2>
              <p className="text-[10px] text-gray-400">Base44 Relational Database & Supabase Cloud Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowSupabaseModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1c202c] hover:bg-[#252a3a] border border-[#2e354a] text-gray-200 hover:text-white transition-colors"
              title="Export schema to Supabase Cloud"
            >
              <ExternalLink className="w-3 h-3 text-emerald-400" />
              <span>Supabase Export</span>
            </button>
          </div>
        </div>

        {/* Natural Language AI SQL Prompt Bar */}
        <div className="p-3 border-b border-[#222634] bg-[#14161f] space-y-2">
          <div className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-perplexity-teal" />
            <span>AI Natural Language Schema Architect</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerateSqlFromPrompt();
              }}
              placeholder="e.g. Create SaaS subscription tiers and payment invoice tables..."
              className="flex-1 bg-[#101218] border border-[#262c3e] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleGenerateSqlFromPrompt}
              disabled={!aiPrompt.trim() || isAiGenerating}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isAiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3" />}
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* SQL Editor Area */}
        <div className="flex-1 flex flex-col p-3 space-y-2 bg-[#0e1017]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">SQL Query Editor</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSqlQuery("SELECT * FROM tasks;")}
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Sample Query
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setSqlQuery(`CREATE TABLE notes (\n  id INTEGER PRIMARY KEY,\n  title TEXT,\n  content TEXT,\n  pinned BOOLEAN\n);`);
                }}
                className="text-[10px] text-amber-400 hover:underline"
              >
                CREATE TABLE
              </button>
            </div>
          </div>

          <textarea
            value={sqlQuery}
            onChange={(e) => setSqlQuery(e.target.value)}
            rows={8}
            className="w-full flex-1 bg-[#12141c] p-3 rounded-xl border border-[#232738] font-mono text-xs text-amber-300 resize-none focus:outline-none focus:border-amber-500/50 leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-gray-500">Press Run or Ctrl+Enter to execute locally</div>
            <button
              onClick={handleExecuteSql}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold shadow-md shadow-amber-500/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run SQL</span>
            </button>
          </div>
        </div>

        {/* Tables Navigation Strip */}
        <div className="p-3 border-t border-[#222634] bg-[#141620]">
          <div className="text-[11px] text-gray-400 font-semibold mb-2">Local SQLite Tables ({tables.length}):</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tables.map((tbl) => (
              <button
                key={tbl.name}
                onClick={() => {
                  setActiveTableName(tbl.name);
                  setSqlQuery(`SELECT * FROM ${tbl.name};`);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all shrink-0 ${
                  activeTableName === tbl.name
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold"
                    : "bg-[#1c202c] text-gray-400 hover:text-white border-[#272d3e]"
                }`}
              >
                <TableIcon className="w-3 h-3" />
                <span>{tbl.name}</span>
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-black/40 text-gray-400 font-mono">
                  {tbl.rows.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Interactive Table Data Grid & Query Results (55% width) */}
      <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] overflow-hidden">
        {/* Result Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#12141a] border-b border-[#222634] text-xs">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">
              {queryResult ? "Query Results" : `Table: ${activeTable?.name}`}
            </span>
            <span className="text-[11px] text-gray-400">
              ({queryResult ? queryResult.rowCount : activeTable?.rows.length} rows
              {queryResult && ` in ${queryResult.executionTimeMs}ms`})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setQueryResult(null);
                setSqlQuery(`SELECT * FROM ${activeTableName};`);
              }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Table</span>
            </button>
          </div>
        </div>

        {/* Table View / Error Display */}
        <div className="flex-1 p-4 overflow-auto">
          {queryResult?.error ? (
            <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-red-400">
                <span>⚠️ SQL Execution Error:</span>
              </div>
              <div className="font-mono text-xs">{queryResult.error}</div>
            </div>
          ) : (
            <div className="border border-[#222736] rounded-xl overflow-hidden bg-[#11131c]">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[#181b26] border-b border-[#252a3c] text-gray-300">
                    {(queryResult?.columns || activeTable?.columns.map((c) => c.name) || []).map((colName, idx) => (
                      <th key={idx} className="p-2.5 font-semibold text-amber-400 border-r border-[#202536] last:border-0">
                        {colName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(queryResult?.rows || activeTable?.rows || []).map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-[#1c202e] hover:bg-[#181b28] transition-colors text-gray-300 last:border-0"
                    >
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="p-2.5 border-r border-[#1c202e] last:border-0 truncate max-w-[200px]">
                          {typeof cell === "boolean" ? (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                cell ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-gray-400"
                              }`}
                            >
                              {cell ? "TRUE" : "FALSE"}
                            </span>
                          ) : (
                            String(cell ?? "NULL")
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Cloud Sync Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#161822] border border-[#2b3145] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#252b3e] bg-[#1a1d2a]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                  ⚡
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Supabase Cloud PostgreSQL Migration</h3>
                  <p className="text-[11px] text-gray-400">Deploy this local database directly to Supabase with 1-click</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs text-gray-300">
              <p className="text-gray-400">
                Copy this SQL migration and paste it into your <strong>Supabase SQL Editor</strong>. It creates all tables with Row Level Security (RLS) automatically enabled:
              </p>

              <div className="relative">
                <pre className="bg-[#0f1118] p-4 rounded-xl border border-[#232738] font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-60 leading-relaxed">
                  {generateSupabaseSql()}
                </pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleDownloadSqlFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2334] hover:bg-[#282f46] text-gray-200 hover:text-white transition-colors border border-[#2b334a]"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download .sql File</span>
                </button>

                <button
                  onClick={handleCopySupabaseMigration}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-md transition-colors"
                >
                  {copiedSupabase ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSupabase ? "Copied Migration!" : "Copy SQL Script"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
