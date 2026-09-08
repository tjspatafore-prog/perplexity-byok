export type ProviderType = "google" | "openai" | "anthropic" | "grok" | "kimi" | "qwen" | "deepgram";

export type FocusMode = "web" | "academic" | "writing" | "swarm" | "deep-research";

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderType;
  description: string;
  pricing: string; // e.g. "$2.00 in / $6.00 out"
  badge?: string;
  contextWindow?: string;
  apiModelName?: string; // underlying API model identifier
}

export interface ApiKeys {
  google?: string;
  openai?: string;
  anthropic?: string;
  grok?: string;
  kimi?: string;
  qwen?: string;
  deepgram?: string;
}

export interface SearchResult {
  id: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  favicon?: string;
}

export interface SearchStep {
  text: string;
  status: "pending" | "active" | "completed";
  timestamp?: number;
}

export interface SwarmAgentMessage {
  agentId: string;
  agentName: string;
  modelId: string;
  provider: ProviderType;
  role: "scout" | "critic" | "synthesizer";
  roleLabel: string;
  avatarColor: string;
  content: string;
  status: "thinking" | "streaming" | "completed";
}

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // extracted text content
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SearchResult[];
  followUps?: string[];
  searchSteps?: SearchStep[];
  swarmDialogue?: SwarmAgentMessage[];
  attachedFiles?: UploadedDocument[];
  modelUsed?: string;
  focusMode?: FocusMode;
  createdAt: number;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId: string;
  focusMode: FocusMode;
  messages: Message[];
}

export type WorkspaceView =
  | "search"
  | "builder"
  | "agents"
  | "database"
  | "desktop"
  | "monitors";

export interface SuperAgent {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  color: string;
  provider: ProviderType;
  modelId: string;
  systemPrompt: string;
  specialty: "coding" | "design" | "analysis" | "research" | "growth";
  isCustom?: boolean;
}

export interface AppVersion {
  id: string;
  versionNumber: number;
  prompt: string;
  code: string;
  language: "html" | "jsx";
  explanation?: string;
  timestamp: number;
}

export interface AppProject {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  agentId?: string;
  modelId: string;
  versions: AppVersion[];
  currentVersionIndex: number;
}

export interface GoogleWorkspaceSettings {
  clientId?: string;
  apiKey?: string;
  isConnected?: boolean;
  userEmail?: string;
}

export interface AppSettings {
  keys: ApiKeys;
  defaultModel: string;
  defaultFocusMode: FocusMode;
  autoSpeak: boolean;
  deepgramVoice: string;
  modelAliases?: Record<string, string>;
  swarmRoster?: string[]; // Custom list of model IDs to form the swarm
  customAgents?: SuperAgent[];
  googleWorkspace?: GoogleWorkspaceSettings;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  // Google
  {
    id: "gemini-3.8-flash-high",
    name: "Gemini 3.8 Flash",
    provider: "google",
    pricing: "$0.75 in / $3.75 out",
    description: "Next-gen ultra-fast hybrid reasoning with high-rate web synthesis",
    badge: "Recommended",
    contextWindow: "1M tokens",
    apiModelName: "gemini-3.8-flash",
  },
  {
    id: "gemini-3.1-pro-high",
    name: "Gemini 3.1 Pro",
    provider: "google",
    pricing: "$2.00 in / $12.00 out",
    description: "Deep multimodal research and complex analytical synthesis",
    contextWindow: "2M tokens",
    apiModelName: "gemini-3.1-pro",
  },

  // Anthropic Claude
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    pricing: "$3.00 in / $15.00 out",
    description: "Anthropic's latest hybrid reasoning & intelligence flagship",
    badge: "New",
    contextWindow: "200k tokens",
    apiModelName: "claude-sonnet-5",
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "anthropic",
    pricing: "$5.00 in / $25.00 out",
    description: "Peak cognitive power for exhaustive academic & domain research",
    badge: "Frontier",
    contextWindow: "200k tokens",
    apiModelName: "claude-opus-5",
  },
  {
    id: "claude-fable-5.1",
    name: "Claude Fable 5.1",
    provider: "anthropic",
    pricing: "$10.00 in / $50.00 out",
    description: "Ultra-high reasoning capacity for creative drafting and deep synthesis",
    contextWindow: "200k tokens",
    apiModelName: "claude-fable-5.1",
  },

  // OpenAI
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    pricing: "$5.00 in / $30.00 out",
    description: "Balanced multi-agent reasoning, coding, and search grounding",
    contextWindow: "128k tokens",
    apiModelName: "gpt-5.6-sol",
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    pricing: "$2.50 in / $15.00 out",
    description: "Heavy reasoning engine with reinforced factual grounding",
    contextWindow: "128k tokens",
    apiModelName: "gpt-5.6-terra",
  },
  {
    id: "gpt-6-astra",
    name: "GPT-6 Astra",
    provider: "openai",
    pricing: "$10.00 in / $50.00 out",
    description: "OpenAI's frontier intelligence tier for maximum problem solving",
    badge: "Frontier",
    contextWindow: "256k tokens",
    apiModelName: "gpt-6-astra",
  },

  // xAI (Grok)
  {
    id: "grok-4.6",
    name: "Grok 4.6",
    provider: "grok",
    pricing: "$2.00 in / $6.00 out",
    description: "xAI's high-speed real-time intelligence and candid reasoning",
    badge: "xAI",
    contextWindow: "128k tokens",
    apiModelName: "grok-4.6",
  },

  // Alibaba Cloud (Qwen)
  {
    id: "qwen-3.8-max",
    name: "Qwen 3.8 Max",
    provider: "qwen",
    pricing: "$2.00 in / $6.00 out",
    description: "Alibaba's advanced reasoning & character model",
    badge: "Popular",
    contextWindow: "128k tokens",
    apiModelName: "qwen-plus-character",
  },
  {
    id: "qwen-3.7-plus",
    name: "3.7 Plus",
    provider: "qwen",
    pricing: "$0.40 in / $1.60 out",
    description: "Ultra-fast, cost-efficient character & search model",
    contextWindow: "128k tokens",
    apiModelName: "qwen-flash-character",
  },

  // Moonshot AI (Kimi)
  {
    id: "kimi-k3",
    name: "Kimi K3",
    provider: "kimi",
    pricing: "$3.00 in / $15.00 out",
    description: "Moonshot AI's next-gen deep-context search and analysis engine",
    badge: "Long Context",
    contextWindow: "200k tokens",
    apiModelName: "kimi-k3",
  },
  {
    id: "kimi-k2",
    name: "Kimi K2",
    provider: "kimi",
    pricing: "$1.50 in / $7.50 out",
    description: "High-speed document parsing and factual Q&A",
    contextWindow: "128k tokens",
    apiModelName: "kimi-k2",
  },
];

export const BUILTIN_SUPER_AGENTS: SuperAgent[] = [
  {
    id: "full-stack-architect",
    name: "Full-Stack App Architect",
    tagline: "Builds complete, interactive web apps & tools with React, Tailwind & Lucide",
    avatar: "⚡",
    color: "from-cyan-500 to-blue-600",
    provider: "anthropic",
    modelId: "claude-3-7-sonnet-latest",
    specialty: "coding",
    systemPrompt: `You are an elite Full-Stack App Architect and Software Engineer.
Your purpose is to build production-grade, highly interactive single-file React and Tailwind web applications, dashboards, calculators, and games.
Key principles:
1. Always write completely functional, self-contained code with real state, realistic mock data, and full interactivity.
2. Design with modern aesthetics: clean typography, dark-theme accents, polished card containers, subtle borders, and smooth hover transitions.
3. Include Lucide icons, responsive flex/grid layouts, and thorough error-resilient logic.`,
  },
  {
    id: "saas-ui-designer",
    name: "SaaS UI/UX Designer",
    tagline: "Designs sleek, modern product interfaces, landing pages & design systems",
    avatar: "🎨",
    color: "from-purple-500 to-pink-600",
    provider: "anthropic",
    modelId: "claude-3-7-sonnet-latest",
    specialty: "design",
    systemPrompt: `You are a world-class Product Designer & Creative Technologist inspired by Linear, Stripe, and Apple.
You design breathtaking user interfaces, interactive component systems, and high-conversion landing pages.
Key principles:
1. Masterful visual hierarchy, generous whitespace, crisp micro-borders, and tasteful gradients.
2. Add interactive controls (theme toggles, filter buttons, tabs, modal previews, search inputs).
3. Ensure mobile, tablet, and desktop viewports are completely responsive.`,
  },
  {
    id: "data-financial-analyst",
    name: "Data & Financial Analyst",
    tagline: "Builds financial calculators, metrics dashboards, charts & portfolio tools",
    avatar: "📊",
    color: "from-emerald-500 to-teal-600",
    provider: "google",
    modelId: "gemini-3.8-flash-high",
    specialty: "analysis",
    systemPrompt: `You are a Principal Financial Analyst and Data Scientist.
You build interactive quantitative models, budgeting tools, portfolio visualizers, ROI calculators, and KPI metrics dashboards.
Key principles:
1. Build rich analytical controls: sliders for rates/variables, sorting/filtering tables, and instant mathematical recalculations.
2. Present metrics with visual stat badges (+12.4% MoM, trend badges, colored progress bars).
3. Provide realistic default values so the user gets immediate value upon opening the tool.`,
  },
  {
    id: "autonomous-researcher",
    name: "Autonomous Research Fellow",
    tagline: "Performs exhaustive multi-source investigations and drafts whitepapers",
    avatar: "🔬",
    color: "from-amber-500 to-orange-600",
    provider: "google",
    modelId: "gemini-2.5-pro",
    specialty: "research",
    systemPrompt: `You are a Senior Principal Research Fellow.
You synthesize complex scientific, technological, and market developments into comprehensive, publication-grade whitepapers.
Key principles:
1. Ground assertions in verified empirical benchmarks, patents, and scientific literature.
2. Use structured multi-perspective analysis (technical feasibility, economic viability, systemic risks).
3. Formulate rigorous comparative tables and actionable strategic roadmaps.`,
  },
  {
    id: "growth-marketing-architect",
    name: "Growth & Product Strategist",
    tagline: "Creates high-converting landing pages, sales funnels & pricing tools",
    avatar: "🚀",
    color: "from-rose-500 to-red-600",
    provider: "openai",
    modelId: "gpt-4o",
    specialty: "growth",
    systemPrompt: `You are a Growth Architect and SaaS Marketing Strategist.
You build interactive product marketing experiences, interactive pricing calculators, feature comparison grids, and lead magnets.
Key principles:
1. Lead with irresistible value propositions, clear social proof, and compelling call-to-actions.
2. Include interactive feature estimators or tier calculators to engage visitors.
3. Optimize for trust, clarity, and friction-free user flows.`,
  },
];

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: "jsx" | "js" | "json" | "sql" | "md" | "css";
}

export interface SqlColumn {
  name: string;
  type: string;
}

export interface SqlQueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface DatabaseTable {
  name: string;
  columns: SqlColumn[];
  rows: any[][];
}

export interface TerminalLog {
  id: string;
  type: "command" | "output" | "error" | "info";
  content: string;
  timestamp: number;
}

export interface ScheduledMonitor {
  id: string;
  name: string;
  schedule: string;
  targetQuery: string;
  focusArea: "ai-research" | "web-watcher" | "code-audit";
  status: "active" | "paused" | "running";
  lastRun?: number;
  lastFinding?: string;
  findingsCount: number;
}
