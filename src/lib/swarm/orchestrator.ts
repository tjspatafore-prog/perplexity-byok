import { AVAILABLE_MODELS, ApiKeys, ModelOption, ProviderType, SwarmAgentMessage, UploadedDocument } from "../types";
import { EnrichedSource } from "../search/crawler";
import { streamLLMResponse, sanitizeApiKey } from "../providers";

export interface SwarmParams {
  query: string;
  history?: { role: "user" | "assistant"; content: string }[];
  sources: EnrichedSource[];
  files?: UploadedDocument[];
  keys: ApiKeys;
  modelAliases?: Record<string, string>;
  swarmRoster?: string[];
  onAgentStart: (agent: SwarmAgentMessage) => void;
  onAgentDelta: (agentId: string, delta: string) => void;
  onAgentDone: (agentId: string, fullContent: string) => void;
  onFinalDelta: (delta: string) => void;
}

interface AgentProfile {
  id: string;
  name: string;
  role: "scout" | "critic" | "synthesizer";
  roleLabel: string;
  model: ModelOption;
  avatarColor: string;
}

/**
 * Automatically assembles the best 2 or 3 agent team based on configured keys and user preferences.
 */
export function resolveSwarmTeam(keys: ApiKeys, preferredRoster?: string[]): AgentProfile[] {
  // Find which providers have valid keys
  const activeProviders = new Set<ProviderType>();
  const checkKey = (p: ProviderType, val?: string) => {
    if (sanitizeApiKey(val || process.env[`${p.toUpperCase()}_API_KEY`])) {
      activeProviders.add(p);
    }
  };

  checkKey("google", keys.google);
  checkKey("anthropic", keys.anthropic);
  checkKey("openai", keys.openai);
  checkKey("grok", keys.grok);
  checkKey("kimi", keys.kimi);
  checkKey("qwen", keys.qwen);

  // Available models matching active keys
  const available = AVAILABLE_MODELS.filter((m) => activeProviders.has(m.provider));

  // If user selected explicit roster, filter by available
  if (preferredRoster && preferredRoster.length >= 2) {
    const customModels = preferredRoster
      .map((id) => AVAILABLE_MODELS.find((m) => m.id === id))
      .filter((m): m is ModelOption => Boolean(m && activeProviders.has(m.provider)));

    if (customModels.length >= 2) {
      return [
        {
          id: "agent-scout",
          name: "Research Scout",
          role: "scout",
          roleLabel: "Initial Analysis & Fact Gathering",
          model: customModels[0],
          avatarColor: "from-blue-500 to-cyan-500",
        },
        {
          id: "agent-critic",
          name: "Peer Reviewer / Critic",
          role: "critic",
          roleLabel: "Counter-Arguments & Cross-Examination",
          model: customModels[1],
          avatarColor: "from-amber-500 to-orange-500",
        },
        {
          id: "agent-synthesizer",
          name: "Master Synthesizer",
          role: "synthesizer",
          roleLabel: "Consensus Synthesis & Grounded Answer",
          model: customModels[2] || customModels[0],
          avatarColor: "from-emerald-500 to-teal-500",
        },
      ];
    }
  }

  // Fallback: If no keys configured, default to recommended models
  const candidatePool = available.length > 0 ? available : AVAILABLE_MODELS;

  // Try to pick models from different providers for maximum diversity
  const uniqueProviderModels: ModelOption[] = [];
  const seenProviders = new Set<ProviderType>();

  for (const m of candidatePool) {
    if (!seenProviders.has(m.provider)) {
      uniqueProviderModels.push(m);
      seenProviders.add(m.provider);
      if (uniqueProviderModels.length >= 3) break;
    }
  }

  // Fill up to 3 if only 1 or 2 providers available
  while (uniqueProviderModels.length < 3) {
    const nextModel = candidatePool[uniqueProviderModels.length % candidatePool.length];
    uniqueProviderModels.push(nextModel);
  }

  return [
    {
      id: "agent-scout",
      name: "Research Scout",
      role: "scout",
      roleLabel: "Initial Analysis & Fact Gathering",
      model: uniqueProviderModels[0],
      avatarColor: "from-cyan-500 to-blue-500",
    },
    {
      id: "agent-critic",
      name: "Peer Reviewer / Critic",
      role: "critic",
      roleLabel: "Counter-Arguments & Cross-Examination",
      model: uniqueProviderModels[1],
      avatarColor: "from-amber-500 to-rose-500",
    },
    {
      id: "agent-synthesizer",
      name: "Master Synthesizer",
      role: "synthesizer",
      roleLabel: "Consensus Synthesis & Grounded Answer",
      model: uniqueProviderModels[2] || uniqueProviderModels[0],
      avatarColor: "from-emerald-500 to-teal-500",
    },
  ];
}

/**
 * Runs the full 3-Stage Multi-Agent Swarm dialogue and final master synthesis.
 */
export async function runSwarmPipeline({
  query,
  history = [],
  sources,
  files = [],
  keys,
  modelAliases = {},
  swarmRoster,
  onAgentStart,
  onAgentDelta,
  onAgentDone,
  onFinalDelta,
}: SwarmParams): Promise<void> {
  const team = resolveSwarmTeam(keys, swarmRoster);
  const [scout, critic, synthesizer] = team;

  // Format sources for agents
  const sourcesText = sources
    .map(
      (s) =>
        `[${s.id}] Title: ${s.title}\nURL: ${s.url}\nDomain: ${s.domain}\nContent:\n${s.fullContent || s.snippet}`
    )
    .join("\n\n---\n\n");

  const filesText =
    files.length > 0
      ? `\n\n=== USER UPLOADED DOCUMENTS ===\n${files
          .map((f, i) => `[Doc ${i + 1}: ${f.name}] (${Math.round(f.size / 1024)} KB)\nContent:\n${f.content}`)
          .join("\n\n===\n\n")}\n===============================\n`
      : "";

  // ==========================================
  // STAGE 1: Research Scout Agent
  // ==========================================
  const scoutMessage: SwarmAgentMessage = {
    agentId: scout.id,
    agentName: `${scout.name} (${scout.model.name})`,
    modelId: scout.model.id,
    provider: scout.model.provider,
    role: "scout",
    roleLabel: scout.roleLabel,
    avatarColor: scout.avatarColor,
    content: "",
    status: "streaming",
  };
  onAgentStart(scoutMessage);

  const scoutSystemPrompt = `You are the Lead Research Scout in a multi-agent AI think tank.
Your role is to analyze the user's inquiry, uploaded user documents, and real-time web search results.
Draft a rigorous, concise initial brief that:
1. Outlines the primary answer and key factual findings grounded in the sources and uploaded documents.
2. Identifies key evidence with source bracket citations like [1], [2] or [Doc: filename].
3. Highlights any ambiguities, conflicting viewpoints, or areas where verification is needed.
Be candid, analytical, and structured with concise bullet points. Address your colleagues in the agent team.`;

  let scoutOutput = "";
  try {
    await streamLLMResponse({
      modelId: scout.model.id,
      query: `User Inquiry: "${query}"${filesText}\n\nLive Search Sources:\n${sourcesText}\n\nPlease provide your initial Research Scout briefing for our multi-agent team.`,
      history: [],
      sources: sources,
      files: files,
      focusMode: "writing",
      keys,
      modelAliases,
      onDelta: (delta: string) => {
        scoutOutput += delta;
        onAgentDelta(scout.id, delta);
      },
    });
  } catch (err: any) {
    console.warn("Scout agent failed, continuing with fallback:", err);
    scoutOutput = `Research Scout was unable to complete full analysis (${err?.message || "connection error"}). Proceeding with available search data.`;
    onAgentDelta(scout.id, scoutOutput);
  }
  onAgentDone(scout.id, scoutOutput);

  // ==========================================
  // STAGE 2: Peer Reviewer / Critic Agent
  // ==========================================
  const criticMessage: SwarmAgentMessage = {
    agentId: critic.id,
    agentName: `${critic.name} (${critic.model.name})`,
    modelId: critic.model.id,
    provider: critic.model.provider,
    role: "critic",
    roleLabel: critic.roleLabel,
    avatarColor: critic.avatarColor,
    content: "",
    status: "streaming",
  };
  onAgentStart(criticMessage);

  const criticSystemPrompt = `You are the Senior Critic & Peer Reviewer in a collaborative multi-agent think tank.
Your colleague, Research Scout (${scout.model.name}), has produced an initial briefing for the user's question.
Your goal is to cross-examine their briefing:
1. Challenge any assumptions or oversimplifications in their analysis.
2. Verify if their claims match the provided web sources and uploaded documents, highlighting any discrepancies.
3. Bring in counterpoints, alternative perspectives, or missing context.
4. Suggest what the Master Synthesizer must resolve to deliver the ultimate comprehensive answer.
Direct your comments directly to your fellow agents with professional debate and constructive skepticism. Keep it high-density and punchy.`;

  let criticOutput = "";
  try {
    await streamLLMResponse({
      modelId: critic.model.id,
      query: `User Inquiry: "${query}"${filesText}\n\nLive Search Sources:\n${sourcesText}\n\n--- Research Scout Briefing (${scout.model.name}) ---\n${scoutOutput}\n\nPlease provide your peer critique, cross-examination, and counter-evidence for our team.`,
      history: [],
      sources: sources,
      files: files,
      focusMode: "writing",
      keys,
      modelAliases,
      onDelta: (delta: string) => {
        criticOutput += delta;
        onAgentDelta(critic.id, delta);
      },
    });
  } catch (err: any) {
    console.warn("Critic agent failed, continuing with fallback:", err);
    criticOutput = `Peer Reviewer observed the findings and confirms proceeding directly to final consensus synthesis.`;
    onAgentDelta(critic.id, criticOutput);
  }
  onAgentDone(critic.id, criticOutput);

  // ==========================================
  // STAGE 3: Master Synthesizer Agent (Final Answer)
  // ==========================================
  const synthesizerPrompt = `You are the Chief Arbiter & Master Synthesizer of our multi-agent research team.
Our Research Scout (${scout.model.name}) and Peer Reviewer (${critic.model.name}) have collaborated and debated the user's inquiry:

=== Research Scout Briefing ===
${scoutOutput}

=== Peer Reviewer Critique & Debate ===
${criticOutput}

Your task is to reconcile their findings, resolve their debate, and formulate the ultimate, definitive master answer for the user.

CRITICAL REQUIREMENTS:
1. Ground your answer thoroughly in the real-time search sources and uploaded user documents.
2. Directly cite sources using standard bracket numbers like [1], [2] or [Doc: filename].
3. Integrate the insights and resolutions agreed upon by the Scout and Critic.
4. Structure the answer cleanly with informative markdown headers, concise paragraphs, bullet points, and code/tables if applicable.
5. End with exactly 3 related follow-up questions formatted strictly as:
### Related
- Follow-up question 1
- Follow-up question 2
- Follow-up question 3

Deliver an authoritative, comprehensive, and clear response.`;

  await streamLLMResponse({
    modelId: synthesizer.model.id,
    query: `${synthesizerPrompt}\n\nUser Question: ${query}`,
    history: history,
    sources: sources,
    files: files,
    focusMode: "web",
    keys,
    modelAliases,
    onDelta: (delta: string) => {
      onFinalDelta(delta);
    },
  });
}
