import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import { tokenStorage } from "../api/client";
import type { LoginPayload, RegisterPayload, User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // 'loading' arranca en true: mientras validamos un token guardado, no
  // queremos decidir rutas todavía (evita parpadeos de login → home).
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token guardado, recuperamos el usuario.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  async function login(payload: LoginPayload): Promise<User> {
    const res = await authApi.login(payload);
    tokenStorage.set(res.access_token);
    setUser(res.user);
    return res.user;
  }

  async function register(payload: RegisterPayload): Promise<User> {
    const res = await authApi.register(payload);
    tokenStorage.set(res.access_token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    tokenStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
