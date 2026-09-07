import { NextRequest, NextResponse } from "next/server";

// Persistent in-memory & file-backed store for user vault payloads
// Keyed by Google User ID (sub)
const globalVaultStore: Record<string, { email: string; payload: any; updatedAt: number }> =
  (global as any).__BYOK_VAULT_STORE__ || {};
(global as any).__BYOK_VAULT_STORE__ = globalVaultStore;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const data = globalVaultStore[userId];
    if (!data) {
      return NextResponse.json({ found: false, payload: null });
    }

    return NextResponse.json({ found: true, payload: data.payload, updatedAt: data.updatedAt });
  } catch (err: any) {
    console.error("Vault GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to retrieve vault" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, payload } = body;

    if (!userId || !payload) {
      return NextResponse.json({ error: "Missing required userId or payload" }, { status: 400 });
    }

    // Save to server store
    globalVaultStore[userId] = {
      email: email || "",
      payload,
      updatedAt: Date.now(),
    };

    return NextResponse.json({ success: true, updatedAt: globalVaultStore[userId].updatedAt });
  } catch (err: any) {
    console.error("Vault POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to save vault" }, { status: 500 });
  }
}
