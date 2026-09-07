import { ApiKeys, ChatThread, FocusMode, AppSettings } from "./types";

const KEYS_STORAGE = "nexus_perplexity_keys";
const THREADS_STORAGE = "nexus_perplexity_threads";
const SETTINGS_STORAGE = "nexus_perplexity_settings";

export function loadStoredKeys(): ApiKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEYS_STORAGE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredKeys(keys: ApiKeys): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
  } catch (err) {
    console.error("Failed to save keys to localStorage", err);
  }
}

export function loadStoredSettings(): AppSettings {
  const defaultSettings: AppSettings = {
    keys: {},
    defaultModel: "gemini-3.8-flash-high",
    defaultFocusMode: "web",
    autoSpeak: false,
    deepgramVoice: "flux-brooke-en",
    modelAliases: {},
    swarmRoster: ["gemini-3.8-flash-high", "claude-sonnet-5", "gpt-5.6-sol"],
  };

  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE);
    const keys = loadStoredKeys();
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultSettings, ...parsed, keys };
    }
    return { ...defaultSettings, keys };
  } catch {
    return defaultSettings;
  }
}

export function saveStoredSettings(settings: Partial<AppSettings>): void {
  if (typeof window === "undefined") return;
  try {
    if (settings.keys) {
      saveStoredKeys(settings.keys);
    }
    const current = loadStoredSettings();
    const updated = { ...current, ...settings };
    delete (updated as any).keys; // store keys separately
    localStorage.setItem(SETTINGS_STORAGE, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save settings", err);
  }
}

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(THREADS_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THREADS_STORAGE, JSON.stringify(threads));
  } catch (err) {
    console.error("Failed to save threads", err);
  }
}

export function exportUserData(): string {
  const data = {
    settings: loadStoredSettings(),
    threads: loadThreads(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importUserData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.settings) {
      if (parsed.settings.keys) saveStoredKeys(parsed.settings.keys);
      saveStoredSettings(parsed.settings);
    }
    if (Array.isArray(parsed.threads)) {
      saveThreads(parsed.threads);
    }
    return true;
  } catch (e) {
    console.error("Import failed:", e);
    return false;
  }
}
