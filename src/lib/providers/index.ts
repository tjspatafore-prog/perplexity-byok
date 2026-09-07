import OpenAI from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnrichedSource } from "../search/crawler";
import { ApiKeys, FocusMode, AVAILABLE_MODELS, UploadedDocument } from "../types";

export interface StreamParams {
  modelId: string;
  query: string;
  history?: { role: "user" | "assistant"; content: string }[];
  sources: EnrichedSource[];
  files?: UploadedDocument[];
  focusMode: FocusMode;
  keys: ApiKeys;
  modelAliases?: Record<string, string>;
  onDelta: (chunk: string) => void;
}

function buildSystemPrompt(
  sources: EnrichedSource[],
  focusMode: FocusMode,
  files: UploadedDocument[] = []
): string {
  const filesContext =
    files.length > 0
      ? `\n\n=== USER UPLOADED DOCUMENTS ===\n${files
          .map(
            (f, idx) =>
              `[Doc ${idx + 1}: ${f.name}] (${Math.round(f.size / 1024)} KB)\nContent:\n${f.content}`
          )
          .join("\n\n===\n\n")}\n===============================\n`
      : "";

  const docInstruction =
    files.length > 0
      ? `\nCRITICAL DOCUMENT RULES:\n1. The user has attached ${files.length} document(s). You MUST thoroughly read, analyze, and prioritize information from these uploaded files.\n2. When citing facts from an uploaded document, cite it as [Doc: ${files[0].name}] or [Doc 1].\n`
      : "";

  if (focusMode === "writing" || (sources.length === 0 && files.length === 0)) {
    return `You are an expert AI assistant providing in-depth, rigorous, and direct answers.${filesContext}${docInstruction}
Provide well-structured responses using markdown, headers, bullet points, and code blocks when appropriate.
At the very end of your response, output exactly 3 insightful follow-up questions formatted as:
### Related
- First follow-up question
- Second follow-up question
- Third follow-up question`;
  }

  const sourcesContext = sources
    .map(
      (s) =>
        `[${s.id}] Title: ${s.title}\nURL: ${s.url}\nDomain: ${s.domain}\nContent:\n${s.fullContent || s.snippet}`
    )
    .join("\n\n---\n\n");

  if (focusMode === "deep-research") {
    return `You are an elite Principal Research Analyst and Domain Strategist producing an exhaustive, publication-grade Deep Research Report based on ${sources.length} verified research sources and user-uploaded documents.${filesContext}

YOUR MISSION:
Deliver a comprehensive, exhaustive, and definitive deep-dive whitepaper. Do not summarize briefly—provide thorough, granular, multi-faceted analysis with quantitative data, technical specifications, and structured markdown tables.

MANDATORY STRUCTURE:
# [Topic Title] Comprehensive Research Report
## Executive Summary & Strategic Takeaways
- Core verdict, key metrics, and fundamental findings.

## 1. Architectural Foundations & Technical Mechanisms
- Deep dive into how it works, technical principles, underlying chemistry/code/logic.

## 2. Empirical Benchmarks & State-of-the-Art Evidence
- Experimental data, benchmarks, lab results, and quantitative comparisons.

## 3. Comprehensive Comparative Analysis
- Detailed comparative Markdown table with columns for Paradigm, Performance, Cost, Scalability, Key Limitations.

## 4. Industry Impact, Economics & Commercialization
- Supply chains, manufacturing feasibility, market adoption, and cost trajectories.

## 5. Critical Challenges, Bottlenecks & Counterarguments
- Unresolved issues, controversies, competing viewpoints, and failure modes.

## 6. Strategic Outlook & Future Roadmap (2025–2028)
- What to expect next, projected breakthroughs, and recommendations.

CITATION REQUIREMENTS:${docInstruction}
1. Ground every claim, number, date, and fact in the ${sources.length} provided sources using bracketed numerical citations like [1], [2], [14][22].
2. Distribute citations across the entire body of sources—do not rely only on the first 3 sources.
3. If user documents are provided, cite them as [Doc: filename].

At the very end of your response, output exactly 3 high-impact follow-up inquiries formatted strictly as:
### Related
- First forward-looking research query
- Second strategic exploration query
- Third technical deep-dive query

Here are the ${sources.length} verified sources:
${sourcesContext}`;
  }

  return `You are an expert AI research assistant modeled after Perplexity.ai.
Your objective is to provide comprehensive, accurate, objective, and beautifully structured responses using the provided real-time search results and uploaded user files.${filesContext}

CRITICAL CITATION RULES:
1. Ground your statements directly in the provided web sources and uploaded files.${docInstruction}
2. Whenever you state a claim or fact derived from a web source, cite it immediately using brackets like [1], [2], [3], etc.
3. You can combine citations, e.g., [1][3].
4. Only cite the numbers of the sources provided in the context.
5. Use markdown formatting: clean headers (##, ###), bullet points, bold key terms, tables, and code blocks.
6. Maintain an authoritative, clear, and informative tone. Avoid phrases like "Based on the provided sources". Just answer directly and accurately.

At the very end of your response, provide exactly 3 thoughtful, relevant follow-up questions that the user might want to explore next, strictly formatted as:
### Related
- Follow-up question 1
- Follow-up question 2
- Follow-up question 3

Here are the search sources:
${sourcesContext}`;
}

export function sanitizeApiKey(rawKey?: string): string {
  if (!rawKey) return "";
  let key = rawKey.trim();
  // Strip shell export / variable assignment (e.g. export MOONSHOT_API_KEY="sk-..." or MOONSHOT_API_KEY=sk-...)
  key = key.replace(/^(?:export\s+)?[A-Za-z0-9_]+\s*=\s*/, "");
  // Strip leading Bearer
  key = key.replace(/^Bearer\s+/i, "");
  // Strip leading and trailing quotes (single, double, backtick)
  key = key.replace(/^["'`]|["'`]$/g, "");
  return key.trim();
}

export async function streamLLMResponse({
  modelId,
  query,
  history = [],
  sources,
  files = [],
  focusMode,
  keys,
  modelAliases = {},
  onDelta,
}: StreamParams): Promise<void> {
  const systemPrompt = buildSystemPrompt(sources, focusMode, files);
  const modelDef = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const provider = modelDef?.provider || "google";
  // Exact model sent to API (respects any custom override in Settings)
  const apiModel = modelAliases[modelId] || modelDef?.apiModelName || modelId;

  try {
    // 1. Google Gemini
    if (provider === "google") {
      const cleanGoogleKey = sanitizeApiKey(keys.google || process.env.GOOGLE_API_KEY);
      if (!cleanGoogleKey) {
        throw new Error("Missing Google Gemini API key. Please add it in Settings.");
      }

      const candidateGoogleModels = [
        apiModel,
        ...(apiModel === "gemini-3.8-flash"
          ? ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
          : []),
        ...(apiModel === "gemini-3.1-pro"
          ? [
              "gemini-3.1-pro-preview",
              "gemini-2.5-pro",
              "gemini-2.0-pro-exp-02-05",
              "gemini-1.5-pro-latest",
              "gemini-1.5-pro",
              "gemini-2.0-flash",
            ]
          : []),
      ];

      const genAI = new GoogleGenerativeAI(cleanGoogleKey);
      const chatHistory = history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      let lastGeminiErr: any = null;
      for (const candidate of Array.from(new Set(candidateGoogleModels))) {
        try {
          const model = genAI.getGenerativeModel({
            model: candidate,
            systemInstruction: systemPrompt,
          });

          const chat = model.startChat({
            history: chatHistory,
          });

          const result = await chat.sendMessageStream(query);
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              onDelta(text);
            }
          }
          return;
        } catch (err: any) {
          lastGeminiErr = err;
          if (
            err?.status === 404 ||
            err?.message?.includes("not found") ||
            err?.message?.includes("is not supported")
          ) {
            console.warn(`Gemini model ${candidate} failed (${err?.message}), trying fallback...`);
            continue;
          }
          throw err;
        }
      }
      if (lastGeminiErr) throw lastGeminiErr;
      return;
    }

    // 2. Anthropic Claude (Sonnet 5, Opus 5, Fable 5.1)
    if (provider === "anthropic") {
      const cleanAnthropicKey = sanitizeApiKey(keys.anthropic || process.env.ANTHROPIC_API_KEY);
      if (!cleanAnthropicKey) {
        throw new Error("Missing Anthropic API key. Please add it in Settings.");
      }

      const anthropic = new Anthropic({ apiKey: cleanAnthropicKey });

      const messages = [
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: query },
      ];

      const candidateAnthropicModels = [
        apiModel,
        ...(apiModel === "claude-sonnet-5"
          ? [
              "claude-3-7-sonnet-20250219",
              "claude-3-5-sonnet-latest",
              "claude-3-5-sonnet-20241022",
              "claude-3-5-sonnet-20240620",
              "claude-3-sonnet-20240229",
              "claude-3-haiku-20240307",
            ]
          : []),
        ...(apiModel === "claude-opus-5"
          ? [
              "claude-3-opus-latest",
              "claude-3-opus-20240229",
              "claude-3-7-sonnet-20250219",
              "claude-3-5-sonnet-latest",
              "claude-3-5-sonnet-20241022",
              "claude-3-haiku-20240307",
            ]
          : []),
        ...(apiModel === "claude-fable-5.1"
          ? [
              "claude-3-7-sonnet-20250219",
              "claude-3-5-sonnet-latest",
              "claude-3-5-sonnet-20241022",
              "claude-3-5-sonnet-20240620",
              "claude-3-opus-latest",
              "claude-3-opus-20240229",
              "claude-3-haiku-20240307",
              "claude-3-5-haiku-latest",
              "claude-3-5-haiku-20241022",
            ]
          : []),
        // Universal fallbacks in order of performance and availability
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-latest",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-20240620",
        "claude-3-opus-latest",
        "claude-3-opus-20240229",
        "claude-3-haiku-20240307",
      ];

      let lastAnthropicErr = null;
      const triedCandidates = new Set<string>();

      for (const candidate of candidateAnthropicModels) {
        if (triedCandidates.has(candidate)) continue;
        triedCandidates.add(candidate);
        try {
          const stream = anthropic.messages.stream({
            model: candidate,
            max_tokens: 4096,
            system: systemPrompt,
            messages: messages,
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              onDelta(event.delta.text);
            }
          }
          return;
        } catch (err: any) {
          lastAnthropicErr = err;
          if (
            err?.status === 404 ||
            err?.error?.type === "not_found_error" ||
            err?.message?.includes("not_found") ||
            err?.message?.includes("404")
          ) {
            console.warn(`Anthropic model "${candidate}" returned 404, trying next candidate...`);
            continue;
          }
          throw err;
        }
      }

      // Dynamic discovery fallback: query accessible models from user's account
      try {
        console.log("[Anthropic] Querying models.list() to discover accessible models for this API key...");
        const modelsPage = await anthropic.models.list({ limit: 20 });
        const availableIds = modelsPage.data.map((m) => m.id);
        console.log("[Anthropic] Key accessible models:", availableIds);

        for (const modelId of availableIds) {
          if (triedCandidates.has(modelId)) continue;
          triedCandidates.add(modelId);
          try {
            console.log(`[Anthropic] Attempting discovered model: ${modelId}`);
            const stream = anthropic.messages.stream({
              model: modelId,
              max_tokens: 4096,
              system: systemPrompt,
              messages: messages,
            });

            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                onDelta(event.delta.text);
              }
            }
            return;
          } catch (mErr: any) {
            lastAnthropicErr = mErr;
            if (mErr?.status === 404 || mErr?.message?.includes("not_found") || mErr?.message?.includes("404")) {
              continue;
            }
            throw mErr;
          }
        }
      } catch (listErr: any) {
        console.warn("[Anthropic] Failed to query models.list():", listErr?.message);
      }

      if (lastAnthropicErr) throw lastAnthropicErr;
      return;
    }

    // 3. OpenAI, xAI (Grok), Moonshot (Kimi), Alibaba (Qwen)
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history.map(
        (m) =>
          ({
            role: m.role,
            content: m.content,
          } as OpenAI.Chat.ChatCompletionMessageParam)
      ),
      { role: "user", content: query },
    ];

    // Moonshot AI (Kimi) with exact kimi-k3 and api.moonshot.ai matching user's official snippet
    if (provider === "kimi") {
      const cleanKimiKey = sanitizeApiKey(keys.kimi || process.env.KIMI_API_KEY);
      if (!cleanKimiKey) {
        throw new Error("Missing Moonshot (Kimi) API key. Please add it in Settings.");
      }

      // Exact model string requested: "kimi-k3"
      const candidateKimiModels = [
        apiModel || "kimi-k3",
        ...(apiModel === "kimi-k3" ? ["kimi-k3", "kimi-latest", "moonshot-v1-128k"] : []),
        ...(apiModel === "kimi-k2" ? ["kimi-k2", "moonshot-v1-32k"] : []),
      ];

      const candidateKimiEndpoints = [
        "https://api.moonshot.ai/v1", // Primary: Global platform (platform.moonshot.ai)
        "https://api.moonshot.cn/v1", // Mainland platform (platform.moonshot.cn)
      ];

      let lastKimiErr: any = null;
      for (const endpoint of candidateKimiEndpoints) {
        for (const modelToTry of Array.from(new Set(candidateKimiModels))) {
          try {
            const openai = new OpenAI({
              apiKey: cleanKimiKey,
              baseURL: endpoint,
            });

            // Try streaming first
            try {
              const stream = await openai.chat.completions.create({
                model: modelToTry,
                messages: openaiMessages,
                stream: true,
              });

              for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content;
                if (text) onDelta(text);
              }
              return;
            } catch (streamErr: any) {
              // If stream fails for reasons other than auth, try non-streaming
              if (
                streamErr?.status === 401 ||
                streamErr?.status === 404 ||
                streamErr?.message?.includes("Invalid Authentication")
              ) {
                throw streamErr;
              }
              console.warn(`Kimi stream error on ${modelToTry}, trying non-stream:`, streamErr?.message);
              const nonStream = await openai.chat.completions.create({
                model: modelToTry,
                messages: openaiMessages,
                stream: false,
              });
              const content = nonStream.choices[0]?.message?.content;
              if (content) {
                onDelta(content);
                return;
              }
            }
          } catch (err: any) {
            lastKimiErr = err;
            if (
              err?.status === 401 ||
              err?.status === 404 ||
              err?.message?.includes("Invalid Authentication")
            ) {
              console.warn(
                `Moonshot endpoint ${endpoint} model ${modelToTry} failed (${err?.message}), trying next candidate...`
              );
              continue;
            }
            throw err;
          }
        }
      }
      if (lastKimiErr) {
        if (
          lastKimiErr?.status === 401 ||
          lastKimiErr?.message?.includes("Invalid Authentication")
        ) {
          throw new Error(
            `Moonshot (Kimi) returned 401 Invalid Authentication. Please check: (1) Copy key directly from https://platform.moonshot.ai/ (or https://platform.moonshot.cn/); (2) Ensure your Moonshot account has active balance/credits; (3) Verify no surrounding quotes or extra spaces in Settings.`
          );
        }
        throw lastKimiErr;
      }
      return;
    }

    // Alibaba Cloud (Qwen / DashScope) with qwen-plus-character and qwen-flash-character
    if (provider === "qwen") {
      const cleanQwenKey = sanitizeApiKey(keys.qwen || process.env.QWEN_API_KEY);
      if (!cleanQwenKey) {
        throw new Error("Missing Alibaba Qwen API key. Please add it in Settings.");
      }

      const candidateQwenModels = [
        apiModel,
        ...(apiModel === "qwen-3.8-max" || apiModel === "qwen-plus-character"
          ? ["qwen-plus-character", "qwen-plus", "qwen-turbo", "qwen-max"]
          : []),
        ...(apiModel === "qwen-3.7-plus" || apiModel === "qwen-flash-character"
          ? ["qwen-flash-character", "qwen-flash", "qwen-turbo", "qwen-plus"]
          : []),
      ];

      const candidateQwenEndpoints = [
        "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
      ];

      let lastQwenErr: any = null;
      for (const endpoint of candidateQwenEndpoints) {
        for (const modelToTry of Array.from(new Set(candidateQwenModels))) {
          try {
            const openai = new OpenAI({
              apiKey: cleanQwenKey,
              baseURL: endpoint,
            });

            const stream = await openai.chat.completions.create({
              model: modelToTry,
              messages: openaiMessages,
              stream: true,
            });

            for await (const chunk of stream) {
              const text = chunk.choices[0]?.delta?.content;
              if (text) onDelta(text);
            }
            return;
          } catch (err: any) {
            lastQwenErr = err;
            if (
              err?.status === 400 ||
              err?.status === 401 ||
              err?.status === 403 ||
              err?.status === 404 ||
              err?.code === "AccessDenied.Unpurchased" ||
              err?.error?.code === "AccessDenied.Unpurchased" ||
              err?.message?.includes("Access to model denied") ||
              err?.message?.includes("AccessDenied") ||
              err?.message?.includes("not found")
            ) {
              console.warn(
                `Qwen endpoint ${endpoint} model ${modelToTry} failed (${err?.message || err?.code}), trying next candidate...`
              );
              continue;
            }
            throw err;
          }
        }
      }
      if (lastQwenErr) {
        if (
          lastQwenErr?.code === "AccessDenied.Unpurchased" ||
          lastQwenErr?.error?.code === "AccessDenied.Unpurchased" ||
          lastQwenErr?.message?.includes("Access to model denied") ||
          lastQwenErr?.message?.includes("AccessDenied")
        ) {
          throw new Error(
            `Access denied to model "${apiModel}" on Alibaba Cloud DashScope (AccessDenied.Unpurchased). Please ensure your API key has activated the model family in your Model Studio console (Model Square), or configure an active model slug (like "qwen-turbo" or "qwen-plus") in Settings -> Model IDs.`
          );
        }
        throw lastQwenErr;
      }
      return;
    }

    // xAI (Grok) & OpenAI
    let apiKey = "";
    let baseURL: string | undefined = undefined;

    if (provider === "grok") {
      apiKey = sanitizeApiKey(keys.grok || process.env.GROK_API_KEY);
      baseURL = "https://api.x.ai/v1";
      if (!apiKey) throw new Error("Missing xAI (Grok) API key. Please add it in Settings.");
    } else {
      apiKey = sanitizeApiKey(keys.openai || process.env.OPENAI_API_KEY);
      if (!apiKey) throw new Error("Missing OpenAI API key. Please add it in Settings.");
    }

    const openai = new OpenAI({
      apiKey,
      baseURL,
    });

    const stream = await openai.chat.completions.create({
      model: apiModel,
      messages: openaiMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        onDelta(text);
      }
    }
  } catch (err: any) {
    console.error(`Error calling ${provider} with model ${apiModel}:`, err);
    if (
      err?.status === 404 ||
      err?.error?.type === "not_found_error" ||
      err?.message?.includes("not_found") ||
      err?.message?.includes("404")
    ) {
      throw new Error(
        `Model identifier "${apiModel}" was not found (404) on ${provider.toUpperCase()}'s API endpoint. Please check if your API key has access to this exact model name, or customize the API model string in Settings -> Model IDs.`
      );
    }
    throw err;
  }
}

