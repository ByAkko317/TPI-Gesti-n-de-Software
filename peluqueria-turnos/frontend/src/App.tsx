import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Placeholders: las pantallas reales se construyen en las próximas sub-etapas.
function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-gray-500">Pantalla en construcción.</p>
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
            <Route path="/" element={<Placeholder title="Inicio" />} />
            <Route path="/login" element={<Placeholder title="Ingresar" />} />
            <Route path="/register" element={<Placeholder title="Crear cuenta" />} />

            {/* Cliente y admin autenticados */}
            <Route
              path="/turnos"
              element={
                <ProtectedRoute>
                  <Placeholder title="Mis turnos" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sacar-turno"
              element={
                <ProtectedRoute>
                  <Placeholder title="Sacar turno" />
                </ProtectedRoute>
              }
            />

            {/* Solo admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <Placeholder title="Panel admin" />
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
