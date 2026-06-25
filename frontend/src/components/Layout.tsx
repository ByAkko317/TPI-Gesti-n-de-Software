import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-clay-100/60 bg-cream/80 backdrop-blur">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-xl font-600 tracking-tight">
            Estudio<span className="text-clay-500">.</span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            {user ? (
              <>
                <Link to="/turnos" className="hover:text-clay-600">
                  Mis turnos
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" className="hover:text-clay-600">
                    Panel
                  </Link>
                )}
                <span className="text-ink/50">{user.first_name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-ink px-4 py-1.5 text-cream transition hover:bg-ink/85"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-clay-600">
                  Ingresar
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-ink px-4 py-1.5 text-cream transition hover:bg-ink/85"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Outlet />
      </main>
    </div>
  );
}
