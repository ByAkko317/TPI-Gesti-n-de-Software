import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../types";

interface ProtectedRouteProps {
  children: ReactNode;
  // Si se indica, solo estos roles pueden entrar.
  allow?: Role[];
}

export function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mientras se valida el token guardado, no decidimos nada aún.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Cargando…
      </div>
    );
  }

  // Sin sesión → al login, recordando a dónde quería ir.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Con sesión pero rol no permitido → a su inicio.
  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
