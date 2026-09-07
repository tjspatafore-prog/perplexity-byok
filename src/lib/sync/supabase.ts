import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { EncryptedVaultPayload } from "../crypto/vault";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  // Check env variables first, fallback to browser localStorage if configured manually
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("byok_supabase_url");
    const customKey = localStorage.getItem("byok_supabase_anon_key");
    if (customUrl && customKey) {
      url = customUrl;
      anonKey = customKey;
    }
  }

  return {
    url,
    anonKey,
    isConfigured: !!(url && anonKey),
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

export function saveManualSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("byok_supabase_url", url.trim());
    localStorage.setItem("byok_supabase_anon_key", anonKey.trim());
    supabaseInstance = null; // reset client to re-instantiate
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured yet. Please add your credentials.");

  const { data, error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured yet. Please add your credentials.");

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
}

/**
 * Get current session user
 */
export async function getSessionUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data?.user || null;
}

/**
 * Upload encrypted vault payload to Supabase 'user_vaults' table
 */
export async function uploadEncryptedVault(userId: string, payload: EncryptedVaultPayload) {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured");

  const { error } = await client
    .from("user_vaults")
    .upsert({
      user_id: userId,
      payload: JSON.stringify(payload),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    // If the table doesn't exist yet, we catch it with a clear helpful explanation
    if (error.code === "42P01") {
      throw new Error("Table 'user_vaults' does not exist yet in Supabase. Please run the provided SQL setup script in Supabase SQL editor.");
    }
    throw error;
  }
}

/**
 * Download encrypted vault payload from Supabase
 */
export async function downloadEncryptedVault(userId: string): Promise<EncryptedVaultPayload | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("user_vaults")
    .select("payload")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No rows found
    throw error;
  }

  if (!data?.payload) return null;
  return typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
}
