export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://10.10.26.164:5010/api/v1").replace(/\/$/, "");
export const FILE_BASE_URL = (import.meta.env.VITE_FILE_BASE_URL ?? "http://10.10.26.164:5010/files").replace(/\/$/, "");
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL ?? "http://10.10.26.164:5010").replace(/\/$/, "");

const TOKEN_KEYS = ["admin_access_token", "accessToken", "adminToken", "token"];
const ADMIN_PROFILE_KEY = "admin_profile";

export const getAuthToken = () => {
  if (typeof window === "undefined") return "";

  for (const key of TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim()) return value.trim();
  }

  return "";
};

export const setAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  for (const key of TOKEN_KEYS) {
    window.localStorage.setItem(key, token);
  }
};

export const getStoredAdminProfile = () => {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(ADMIN_PROFILE_KEY);
  if (!raw) return undefined;
  try {
    const profile: unknown = JSON.parse(raw);
    return profile && typeof profile === "object" ? profile as import("./api-client").AdminRecord : undefined;
  } catch {
    return undefined;
  }
};

export const setStoredAdminProfile = (profile: import("./api-client").AdminRecord) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;
  for (const key of TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }
  window.localStorage.removeItem(ADMIN_PROFILE_KEY);
};

export const resolveFileUrl = (value?: string) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith(FILE_BASE_URL)) return value;

  const normalized = value.startsWith("/files") ? value.slice("/files".length) : value;
  const relative = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return `${FILE_BASE_URL}${relative}`;
};

export const resolveAudioUrl = (value?: string) => {
  if (!value) return "";
  if (/^(blob:|data:)/i.test(value)) return value;
  return resolveFileUrl(value);
};
