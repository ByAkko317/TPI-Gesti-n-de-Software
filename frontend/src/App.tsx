import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { BookAppointment } from "./pages/BookAppointment";
import { MyAppointments } from "./pages/MyAppointments";
import { AdminPanel } from "./pages/AdminPanel";

// Placeholders: las pantallas de turnos y panel se construyen en las próximas sub-etapas.
function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-500">{title}</h1>
      <p className="mt-2 text-ink/60">Pantalla en construcción.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Cliente y admin autenticados */}
            <Route
              path="/turnos"
              element={
                <ProtectedRoute>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sacar-turno"
              element={
                <ProtectedRoute>
                  <BookAppointment />
                </ProtectedRoute>
              }
            />

            {/* Solo admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<Placeholder title="Página no encontrada" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
