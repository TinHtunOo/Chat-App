import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LoginInput, RegisterInput, User } from "@chat/shared";
import { api } from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/token";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(() => getToken());

  useEffect(() => {
    if (!getToken()) {
      setIsLoading(false);
      return;
    }

    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => {
        clearToken();
        setTokenState(null); // keep state in sync with storage
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAuth = useCallback((res: { token: string; user: User }) => {
    setToken(res.token);
    setTokenState(res.token); // NEW: so useSocket sees the new token
    setUser(res.user);
  }, []);

  // login and register stay as they are
  const login = useCallback(
    async (input: LoginInput) => {
      handleAuth(await api.login(input));
    },
    [handleAuth],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      handleAuth(await api.register(input));
    },
    [handleAuth],
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null); // NEW
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      token,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
