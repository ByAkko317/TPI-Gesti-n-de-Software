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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold">
            Peluquería
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <Link to="/turnos">Mis turnos</Link>
                {user.role === "admin" && <Link to="/admin">Panel</Link>}
                <span className="text-gray-500">{user.first_name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded bg-gray-900 px-3 py-1 text-white"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Ingresar</Link>
                <Link
                  to="/register"
                  className="rounded bg-gray-900 px-3 py-1 text-white"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
