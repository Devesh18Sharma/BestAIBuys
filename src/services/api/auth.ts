// Auth API client. Talks to the NestJS backend's /auth/* routes.
// In dev: Vite proxies /auth → localhost:9000 (same origin, no CORS).
// In prod: configure VITE_API_BASE_URL to point to the backend origin.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

const TOKEN_KEY = "swipe.auth.token";

export interface AuthResponse {
  token: string;
}

/** JWT payload the backend signs — { email, id }. */
export interface AuthUser {
  email: string;
  id: number;
}

async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    // Nest surfaces validation/business errors as { message: string | string[] }.
    const raw = data?.message;
    const message = Array.isArray(raw)
      ? raw.join(", ")
      : raw || `Request failed (${response.status})`;
    throw new Error(message);
  }

  // /auth/otp may return an empty body — guard the parse.
  return response.json().catch(() => null as T);
}

/**
 * Step 1 of auth: request a one-time code for `email`. The backend creates the
 * code (stored in the `otp` table) and emails it. If the account doesn't exist
 * yet it's created on successful verification — so the same call covers both
 * sign-up and sign-in.
 */
export function requestOtp(email: string): Promise<unknown> {
  return authRequest("otp", { email });
}

/**
 * Step 2 of auth: verify the code. Returns a JWT on success (creating the
 * account first if this is a new email). Throws if the code is wrong/expired.
 */
export function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
  return authRequest<AuthResponse>("verify", { email, otp });
}

// --- Token persistence -------------------------------------------------

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Authorization header for protected backend routes. Returns an empty object
 * when logged out so callers can spread it unconditionally.
 */
export function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Decode the (unverified) JWT payload to recover the user's email/id without
 * a round trip to /auth/current-user. We only read the token we just received
 * from our own backend, so trusting its payload for display is fine — it is
 * never used for authorization decisions on the client.
 */
export function decodeUser(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as { email?: string; id?: number };
    if (!data.email || data.id == null) return null;
    return { email: data.email, id: data.id };
  } catch {
    return null;
  }
}
