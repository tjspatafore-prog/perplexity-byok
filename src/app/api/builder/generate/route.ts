import { NextRequest } from "next/server";
import { streamLLMResponse } from "@/lib/providers";
import { BUILDER_SYSTEM_PROMPT } from "@/lib/builder/system-prompt";
import { BUILTIN_SUPER_AGENTS, SuperAgent } from "@/lib/types";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

const DISCUSS_SYSTEM_PROMPT = `You are a Principal Product Manager & Lead Software Architect in Base44 Discuss Mode.
Your primary role is to brainstorm, plan, refine, and architect web applications and websites with the user WITHOUT modifying the code yet.

GUIDELINES FOR DISCUSS MODE:
1. Brainstorm thoughtfully: Analyze the user's idea, user flows, database models, and feature tradeoffs.
2. Architecture specification: When the user asks for new features, break them down into modular components, required state hooks, and visual UX suggestions.
3. DO NOT output complete \`\`\`jsx ... \`\`\` application code in Discuss Mode! The user has a live running sandbox that we must protect until they flip to "Build Mode".
4. Short snippets or data shapes (e.g. sample JSON state) are allowed when helpful.
5. Provide a crisp, numbered "Recommended Action Plan" at the end. Remind the user they can click "Adopt Plan & Switch to Build Mode" when ready to code!`;

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
      mode = "build", // "discuss" | "build"
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

    let systemPrompt = mode === "discuss" ? DISCUSS_SYSTEM_PROMPT : BUILDER_SYSTEM_PROMPT;

    if (selectedAgent?.systemPrompt) {
      systemPrompt = `${systemPrompt}\n\n### ACTIVE SUPER AGENT PERSONA:\nYou are operating as "${selectedAgent.name}".\n${selectedAgent.systemPrompt}`;
    }

    // Add Emergent-style task checklist instruction if in build mode
    if (mode === "build") {
      systemPrompt = `${systemPrompt}\n\n### EMERGENT MULTI-AGENT EXECUTION:\nBefore outputting the jsx code block, start your response with a clear, concise Emergent Task Checklist:\n- [x] Step 1: Spec & Architecture\n- [x] Step 2: Component & Tailwind Synthesis\n- [x] Step 3: State & Interactive Event Handlers\n- [x] Step 4: Verification & Self-Healing Checks\nThen provide a brief explanation of what was built, followed by the complete executable code block inside \`\`\`jsx ... \`\`\`.`;
    }

    // Construct user instruction, incorporating previous code if this is an iterative update
    let userMessage = prompt;
    if (mode === "discuss") {
      if (currentCode && currentCode.trim().length > 0) {
        userMessage = `Current Application Code Reference (for architectural context):\n\`\`\`jsx\n${currentCode.slice(
          0,
          2000
        )}...\n\`\`\`\n\nUSER TOPIC / QUESTIONS FOR ARCHITECTURAL DISCUSSION:\n${prompt}`;
      }
    } else {
      if (currentCode && currentCode.trim().length > 0) {
        userMessage = `Here is the current application code:\n\`\`\`jsx\n${currentCode}\n\`\`\`\n\nUSER REQUEST FOR UPDATE / ENHANCEMENT:\n${prompt}\n\nProvide the complete, updated application code with all enhancements fully integrated.`;
      }
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
