import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";

export async function POST(req: NextRequest) {
  try {
    const customKey = req.headers.get("x-deepgram-key");
    const apiKey = customKey || process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Deepgram API key. Please configure your Deepgram key in Settings." },
        { status: 400 }
      );
    }

    const {
      text,
      voice = "flux-brooke-en",
      speed = 1,
      expressivity = 0,
    } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Clean markdown headings, links, brackets, and code blocks for clean TTS speech
    const cleanSpeech = text
      .replace(/\[\d+\]/g, "") // remove [1], [2] citations
      .replace(/```[\s\S]*?```/g, "code omitted") // skip large code blocks
      .replace(/`([^`]+)`/g, "$1") // clean inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // clean links
      .replace(/[#*_~>]/g, "") // clean markdown formatting
      .slice(0, 2000); // limit spoken length for comfort

    // 1. Primary: Direct Deepgram v2 Speak API with Brooke's voice
    const modelParam = voice || "flux-brooke-en";
    const v2Url = `https://api.deepgram.com/v2/speak?model=${encodeURIComponent(
      modelParam
    )}&speed=${speed}&expressivity=${expressivity}`;

    try {
      const v2Response = await fetch(v2Url, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: cleanSpeech }),
      });

      if (v2Response.ok && v2Response.body) {
        return new Response(v2Response.body, {
          headers: {
            "Content-Type": v2Response.headers.get("content-type") || "audio/mpeg",
            "Cache-Control": "no-cache",
          },
        });
      }
    } catch (v2Err) {
      console.warn("Direct Deepgram v2 speak failed, trying fallback:", v2Err);
    }

    // 2. Fallback: Deepgram SDK request
    const deepgram = createClient(apiKey);
    const response = await deepgram.speak.request(
      { text: cleanSpeech },
      {
        model: modelParam,
        encoding: "mp3",
      }
    );

    const stream = await response.getStream();
    if (!stream) {
      return NextResponse.json(
        { error: "No audio stream returned from Deepgram" },
        { status: 500 }
      );
    }

    return new Response(stream as any, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    console.error("Deepgram TTS error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate speech" },
      { status: 500 }
    );
  }
}
