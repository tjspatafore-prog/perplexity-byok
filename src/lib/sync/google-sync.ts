import { AppSettings } from "../types";

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken?: string;
}

const STORAGE_KEY_GOOGLE_USER = "byok_google_user_session";
const STORAGE_KEY_GOOGLE_CLIENT_ID = "byok_google_client_id";

export function getStoredGoogleClientId(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  return (
    localStorage.getItem(STORAGE_KEY_GOOGLE_CLIENT_ID) ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  );
}

export function saveStoredGoogleClientId(clientId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_GOOGLE_CLIENT_ID, clientId.trim());
  }
}

export function getGoogleUserSession(): GoogleUserProfile | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY_GOOGLE_USER);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveGoogleUserSession(user: GoogleUserProfile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_GOOGLE_USER, JSON.stringify(user));
  }
}

export function clearGoogleUserSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_GOOGLE_USER);
  }
}

/**
 * Load Google Identity Services script dynamically
 */
export function loadGoogleGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).google?.accounts?.oauth2) return resolve();

    const existingScript = document.getElementById("google-gis-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In script"));
    document.body.appendChild(script);
  });
}

/**
 * Trigger Google Sign-In Flow with standard non-sensitive scopes (openid, email, profile).
 * Does not require sensitive Google Drive permissions, preventing Error 403 access_denied.
 */
export async function triggerGoogleSignIn(
  clientId: string,
  onSuccess: (user: GoogleUserProfile) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    await loadGoogleGisScript();

    if (!(window as any).google?.accounts?.oauth2) {
      throw new Error("Google Identity Services not ready.");
    }

    // Use standard non-sensitive profile scopes only
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: "openid email profile",
      callback: async (response: any) => {
        if (response.error) {
          onError(response.error_description || response.error);
          return;
        }

        const accessToken = response.access_token;
        if (!accessToken) {
          onError("No access token returned from Google");
          return;
        }

        try {
          // Fetch standard Google User Profile
          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!userInfoRes.ok) {
            throw new Error("Failed to retrieve Google profile");
          }

          const userInfo = await userInfoRes.json();
          const userProfile: GoogleUserProfile = {
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name || userInfo.email.split("@")[0],
            picture: userInfo.picture,
            accessToken,
          };

          saveGoogleUserSession(userProfile);
          onSuccess(userProfile);
        } catch (err: any) {
          onError(err.message || "Failed to parse Google user info");
        }
      },
    });

    client.requestAccessToken({ prompt: "consent" });
  } catch (err: any) {
    onError(err.message || "Google Sign-In initialization failed");
  }
}

/**
 * Sync settings & keys to the cloud backend keyed by Google user ID
 */
export async function syncSettingsCloud(
  user: GoogleUserProfile,
  settings: AppSettings
): Promise<boolean> {
  try {
    const payload = {
      keys: settings.keys,
      customAgents: settings.customAgents || [],
      defaultModel: settings.defaultModel,
      defaultFocusMode: settings.defaultFocusMode,
      swarmRoster: settings.swarmRoster,
      modelAliases: settings.modelAliases,
    };

    const res = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        payload,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Failed to sync settings to cloud:", err);
    return false;
  }
}

/**
 * Fetch settings & keys from the cloud backend keyed by Google user ID
 */
export async function fetchSettingsCloud(
  user: GoogleUserProfile
): Promise<Partial<AppSettings> | null> {
  try {
    const res = await fetch(`/api/user/sync?userId=${encodeURIComponent(user.id)}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.found && data.payload) {
      return data.payload;
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch settings from cloud:", err);
    return null;
  }
}

// Backwards compatibility aliases
export const syncSettingsToGoogleDrive = async (accessToken: string, settings: AppSettings) => {
  const user = getGoogleUserSession();
  if (user) return syncSettingsCloud(user, settings);
  return false;
};

export const fetchSettingsFromGoogleDrive = async (accessToken: string) => {
  const user = getGoogleUserSession();
  if (user) return fetchSettingsCloud(user);
  return null;
};
