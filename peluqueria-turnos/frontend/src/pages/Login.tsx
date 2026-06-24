import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../api/client";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      // Si venía de una ruta protegida, vuelve ahí; si no, según su rol.
      const target = from ?? (user.role === "admin" ? "/admin" : "/turnos");
      navigate(target, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos iniciar sesión"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Ingresá a tu cuenta"
      subtitle="Para ver tus turnos y reservar nuevos."
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link to="/register" className="font-500 text-clay-600 hover:underline">
            Creá una
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label="Correo"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-ink py-3 font-500 text-cream transition hover:bg-ink/85 disabled:opacity-60"
        >
          {submitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </AuthShell>
  );
}

// --- Componentes compartidos por Login y Register ---

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="font-display text-3xl font-500 tracking-tight">{title}</h1>
      <p className="mt-2 text-ink/65">{subtitle}</p>
      <div className="mt-8 rounded-2xl border border-clay-100/70 bg-white/60 p-6 shadow-sm">
        {children}
      </div>
      <p className="mt-6 text-center text-sm text-ink/65">{footer}</p>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-500 text-ink/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-clay-100 bg-white px-3 py-2 text-ink outline-none transition focus:border-clay-400 focus:ring-2 focus:ring-clay-400/20"
      />
    </label>
  );
}
