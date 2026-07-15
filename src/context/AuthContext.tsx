import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearToken,
  decodeUser,
  getStoredToken,
  requestOtp as requestOtpRequest,
  storeToken,
  verifyOtp as verifyOtpRequest,
  type AuthUser,
} from "@/services/api/auth";

interface AuthContextValue {
  /** The signed-in user (decoded from the JWT), or null when logged out. */
  user: AuthUser | null;
  /** True iff a token is currently held. */
  isAuthenticated: boolean;
  /** Step 1: send a one-time code to the email. Throws on failure. */
  requestOtp: (email: string) => Promise<void>;
  /** Step 2: verify the code; stores the JWT and signs the user in. Throws on failure. */
  verifyOtp: (email: string, code: string) => Promise<void>;
  /** Drop the token and return to the logged-out state. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Recover the user from any token persisted in a previous session. */
function initialUser(): AuthUser | null {
  const token = getStoredToken();
  return token ? decodeUser(token) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => initialUser());

  const requestOtp = useCallback(async (email: string) => {
    await requestOtpRequest(email);
  }, []);

  // verify returns { token } — store it, then decode the payload so the UI can
  // greet the user without an extra round trip.
  const verifyOtp = useCallback(async (email: string, code: string) => {
    const { token } = await verifyOtpRequest(email, code);
    storeToken(token);
    setUser(decodeUser(token));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      requestOtp,
      verifyOtp,
      logout,
    }),
    [user, requestOtp, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
