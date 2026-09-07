export type ProviderType = "google" | "openai" | "anthropic" | "grok" | "kimi" | "qwen" | "deepgram";

export type FocusMode = "web" | "academic" | "writing" | "swarm";

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

export interface AppSettings {
  keys: ApiKeys;
  defaultModel: string;
  defaultFocusMode: FocusMode;
  autoSpeak: boolean;
  deepgramVoice: string;
  modelAliases?: Record<string, string>;
  swarmRoster?: string[]; // Custom list of model IDs to form the swarm
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

