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
 * Trigger Google OAuth 2.0 Sign-In Flow
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

    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive.appdata",
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
          // Fetch Google User Profile info
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
 * Sync all settings & keys to the user's private Google Drive AppData folder
 */
export async function syncSettingsToGoogleDrive(
  accessToken: string,
  settings: AppSettings
): Promise<boolean> {
  try {
    const payload = JSON.stringify({
      keys: settings.keys,
      customAgents: settings.customAgents || [],
      defaultModel: settings.defaultModel,
      defaultFocusMode: settings.defaultFocusMode,
      swarmRoster: settings.swarmRoster,
      modelAliases: settings.modelAliases,
      updatedAt: Date.now(),
    });

    // 1. Search for existing config file in appDataFolder
    const searchRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='ai_byok_sync.json'&fields=files(id,name)",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!searchRes.ok) return false;
    const searchData = await searchRes.json();
    const existingFile = searchData.files?.[0];

    if (existingFile) {
      // 2. Update existing file
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: payload,
        }
      );
      return updateRes.ok;
    } else {
      // 3. Create new file in appDataFolder using multipart upload
      const metadata = {
        name: "ai_byok_sync.json",
        parents: ["appDataFolder"],
      };

      const boundary = "-------314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        payload +
        closeDelim;

      const createRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );
      return createRes.ok;
    }
  } catch (err) {
    console.error("Failed to sync to Google Drive:", err);
    return false;
  }
}

/**
 * Fetch settings & keys from the user's private Google Drive AppData folder
 */
export async function fetchSettingsFromGoogleDrive(
  accessToken: string
): Promise<Partial<AppSettings> | null> {
  try {
    const searchRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='ai_byok_sync.json'&fields=files(id,name)",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const existingFile = searchData.files?.[0];
    if (!existingFile) return null;

    // Download file content
    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!downloadRes.ok) return null;
    const data = await downloadRes.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch from Google Drive:", err);
    return null;
  }
}
