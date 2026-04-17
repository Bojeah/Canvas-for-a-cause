import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authApi, setUnauthorizedHandler } from "../services/api";
import type {
  JwtPayload,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
} from "../types";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  userId: number | null;
  expiresAt: number | null;
}

interface AuthContextValue extends AuthState {
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<User>;
  applyToken: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payloadJson = atob(padded);
    const payload = JSON.parse(payloadJson) as JwtPayload;

    if (!payload.sub || !payload.role || !payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const isExpired = (expSeconds: number): boolean =>
  expSeconds * 1000 <= Date.now();

const getStateFromToken = (token: string | null): AuthState => {
  if (!token) {
    return {
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      role: null,
      userId: null,
      expiresAt: null,
    };
  }

  const payload = parseJwtPayload(token);
  if (!payload || isExpired(payload.exp)) {
    return {
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      role: null,
      userId: null,
      expiresAt: null,
    };
  }

  const parsedUserId = Number(payload.sub);
  return {
    token,
    isAuthenticated: true,
    isAdmin: payload.role === "admin",
    role: payload.role,
    userId: Number.isFinite(parsedUserId) ? parsedUserId : null,
    expiresAt: payload.exp * 1000,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>(() => {
    // On app load, try to extract auth state from a stored value
    // or fetch from a /me endpoint (implementation optional)
    return {
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      role: null,
      userId: null,
      expiresAt: null,
    };
  });

  const logout = useCallback(async () => {
    // Clear local state
    setAuthState({
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      role: null,
      userId: null,
      expiresAt: null,
    });

    // Clear the HTTP-only cookie on the backend
    try {
      await authApi.logout();
    } catch {
      // Ignore errors during logout
    }
  }, []);

  const applyToken = useCallback((token: string) => {
    const nextState = getStateFromToken(token);
    if (!nextState.isAuthenticated) {
      setAuthState(nextState);
      return;
    }

    // Store token temporarily for decoding, but NOT in localStorage
    // The actual token lives in an HTTP-only cookie
    setAuthState(nextState);
  }, []);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authApi.login(payload);
      applyToken(response.access_token);
    },
    [applyToken],
  );

  const register = useCallback(async (payload: RegisterRequest) => {
    return authApi.register(payload);
  }, []);

  useEffect(() => {
    // On initial load, auth state is already initialized
    // In the future, you could add a /me endpoint here to verify the session
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!authState.expiresAt) {
      return;
    }

    const msUntilExpiry = authState.expiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logout();
    }, msUntilExpiry);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authState.expiresAt, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      isLoading,
      login,
      register,
      applyToken,
      logout,
    }),
    [authState, isLoading, login, register, applyToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
