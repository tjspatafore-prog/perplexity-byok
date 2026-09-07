import { NextRequest } from "next/server";
import { streamLLMResponse } from "@/lib/providers";
import { BUILDER_SYSTEM_PROMPT } from "@/lib/builder/system-prompt";
import { BUILTIN_SUPER_AGENTS, SuperAgent } from "@/lib/types";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await req.json();
    const {
      prompt,
      currentCode,
      history = [],
      modelId = "claude-3-7-sonnet-latest",
      keys = {},
      modelAliases = {},
      agentId,
      customAgents = [],
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing required prompt" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find agent if specified
    const allAgents: SuperAgent[] = [...BUILTIN_SUPER_AGENTS, ...customAgents];
    const selectedAgent = allAgents.find((a) => a.id === agentId);

    // Build comprehensive system prompt
    let systemPrompt = BUILDER_SYSTEM_PROMPT;
    if (selectedAgent?.systemPrompt) {
      systemPrompt = `${BUILDER_SYSTEM_PROMPT}\n\n### ACTIVE SUPER AGENT PERSONA:\nYou are operating as "${selectedAgent.name}".\n${selectedAgent.systemPrompt}`;
    }

    // Construct user instruction, incorporating previous code if this is an iterative update
    let userMessage = prompt;
    if (currentCode && currentCode.trim().length > 0) {
      userMessage = `Here is the current application code:\n\`\`\`jsx\n${currentCode}\n\`\`\`\n\nUSER REQUEST FOR UPDATE / ENHANCEMENT:\n${prompt}\n\nProvide the complete, updated application code with all enhancements fully integrated.`;
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendSSE = async (data: Record<string, any>) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Execute generation in background
    (async () => {
      try {
        await streamLLMResponse({
          modelId,
          query: userMessage,
          history,
          sources: [],
          focusMode: "writing",
          keys,
          modelAliases,
          customSystemPrompt: systemPrompt,
          onDelta: async (chunk: string) => {
            await sendSSE({ type: "delta", chunk });
          },
        });

        await sendSSE({ type: "done" });
      } catch (err: any) {
        console.error("Builder generation error:", err);
        await sendSSE({ type: "error", error: err.message || "Failed to generate code" });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Builder route exception:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error in builder route" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
