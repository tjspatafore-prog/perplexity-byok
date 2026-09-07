import { NextRequest } from "next/server";
import { searchDuckDuckGo } from "@/lib/search/duckduckgo";
import { enrichSourcesWithContent } from "@/lib/search/crawler";
import { streamLLMResponse } from "@/lib/providers";
import { runSwarmPipeline } from "@/lib/swarm/orchestrator";
import { ApiKeys, FocusMode, SwarmAgentMessage, UploadedDocument } from "@/lib/types";

export const maxDuration = 120; // Allow sufficient time for multi-agent swarm research + debate + synthesis

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query,
      history = [],
      modelId = "gemini-3.8-flash-high",
      focusMode = "web",
      keys = {},
      modelAliases = {},
      swarmRoster = [],
      files = [],
    }: {
      query: string;
      history?: { role: "user" | "assistant"; content: string }[];
      modelId?: string;
      focusMode?: FocusMode;
      keys?: ApiKeys;
      modelAliases?: Record<string, string>;
      swarmRoster?: string[];
      files?: UploadedDocument[];
    } = body;

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(type: string, data: any) {
          const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }

        try {
          // Document info step
          if (files.length > 0) {
            sendEvent("step", {
              text: `Analyzing ${files.length} attached document(s): ${files.map((f) => f.name).join(", ")}`,
              status: "completed",
            });
          }

          // 1. Web Search Step (if not purely writing mode)
          let sources: any[] = [];
          if (focusMode !== "writing") {
            const searchLabel =
              focusMode === "swarm"
                ? `Swarm Mode: Gathering live web evidence for agent team...`
                : `Searching the web for "${query.slice(0, 40)}${query.length > 40 ? "..." : ""}"`;

            sendEvent("step", {
              text: searchLabel,
              status: "active",
            });

            const rawSources = await searchDuckDuckGo(query, focusMode === "swarm" ? "web" : focusMode, 7);

            if (rawSources.length > 0) {
              sendEvent("step", {
                text: `Found ${rawSources.length} sources. Extracting content for agents...`,
                status: "active",
              });

              sources = await enrichSourcesWithContent(rawSources, 4);

              sendEvent("sources", sources);

              sendEvent("step", {
                text:
                  focusMode === "swarm"
                    ? "Agent think tank assembled. Commencing peer debate..."
                    : `Synthesizing answer with ${modelId}...`,
                status: "completed",
              });
            } else {
              sendEvent("step", {
                text: `No web results found. Answering with model knowledge & documents...`,
                status: "completed",
              });
            }
          } else {
            sendEvent("step", {
              text: `Synthesizing directly with ${modelId}...`,
              status: "completed",
            });
          }

          // 2. Stream Response (Swarm Mode vs Standard Mode)
          let accumulatedText = "";

          if (focusMode === "swarm") {
            await runSwarmPipeline({
              query,
              history,
              sources,
              files,
              keys,
              modelAliases,
              swarmRoster,
              onAgentStart: (agent: SwarmAgentMessage) => {
                sendEvent("swarm_agent_start", agent);
              },
              onAgentDelta: (agentId: string, delta: string) => {
                sendEvent("swarm_agent_delta", { agentId, delta });
              },
              onAgentDone: (agentId: string, fullContent: string) => {
                sendEvent("swarm_agent_done", { agentId, fullContent });
              },
              onFinalDelta: (delta: string) => {
                accumulatedText += delta;
                sendEvent("delta", { delta });
              },
            });
          } else {
            await streamLLMResponse({
              modelId,
              query,
              history,
              sources,
              files,
              focusMode,
              keys,
              modelAliases,
              onDelta: (delta: string) => {
                accumulatedText += delta;
                sendEvent("delta", { delta });
              },
            });
          }

          // 3. Extract follow-ups if present in the markdown
          let followUps: string[] = [];
          const relatedMatch = accumulatedText.match(/###\s*Related[\s\S]*$/i);
          if (relatedMatch) {
            const block = relatedMatch[0];
            const lines = block
              .split("\n")
              .map((l) => l.trim())
              .filter((l) => l.startsWith("- ") || l.startsWith("* "));
            followUps = lines.map((l) => l.replace(/^[-*]\s*/, "").replace(/^\[|\]$/g, "")).slice(0, 4);
          }

          sendEvent("done", {
            fullText: accumulatedText,
            followUps,
          });

          controller.close();
        } catch (error: any) {
          console.error("Stream generation error:", error);
          sendEvent("error", {
            message: error.message || "An error occurred during response generation.",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Invalid request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
