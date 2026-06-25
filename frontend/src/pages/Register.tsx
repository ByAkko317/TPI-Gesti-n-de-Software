import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../api/client";
import { AuthShell, Field } from "./Login";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    birth_date: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(key: keyof typeof form) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        email: form.email,
        birth_date: form.birth_date || null,
        password: form.password,
      });
      // Tras registrarse, un cliente nuevo va directo a sacar turno.
      navigate("/sacar-turno", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos crear la cuenta"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Creá tu cuenta"
      subtitle="Tardás un minuto y ya podés reservar."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-500 text-clay-600 hover:underline">
            Ingresá
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" value={form.first_name} onChange={set("first_name")} required />
          <Field label="Apellido" value={form.last_name} onChange={set("last_name")} required />
        </div>
        <Field
          label="Celular"
          type="tel"
          value={form.phone}
          onChange={set("phone")}
          autoComplete="tel"
          required
        />
        <Field
          label="Correo"
          type="email"
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
          required
        />
        <Field
          label="Fecha de nacimiento (opcional)"
          type="date"
          value={form.birth_date}
          onChange={set("birth_date")}
        />
        <Field
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={set("password")}
          autoComplete="new-password"
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
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </AuthShell>
  );
}
