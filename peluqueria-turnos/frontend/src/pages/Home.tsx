import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Home() {
  const { user } = useAuth();

  return (
    <div className="py-8">
      <section className="relative overflow-hidden">
        <p className="mb-4 text-sm font-500 uppercase tracking-[0.2em] text-clay-500">
          Peluquería &amp; estudio
        </p>
        <h1 className="max-w-3xl font-display text-5xl font-500 leading-[1.05] tracking-tight sm:text-6xl">
          Tu próximo turno,
          <br />
          en dos toques.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">
          Reservá el horario que te queda cómodo, recibí la confirmación por
          correo y olvidate del resto. Nosotros te recordamos.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <Link
              to="/sacar-turno"
              className="rounded-full bg-clay-500 px-6 py-3 font-500 text-cream transition hover:bg-clay-600"
            >
              Sacar un turno
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="rounded-full bg-clay-500 px-6 py-3 font-500 text-cream transition hover:bg-clay-600"
              >
                Reservar ahora
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-clay-100 px-6 py-3 font-500 text-ink transition hover:border-clay-400"
              >
                Ya tengo cuenta
              </Link>
            </>
          )}
        </div>

        {/* Detalle de firma: una línea fina como un corte limpio. */}
        <div className="mt-16 h-px w-full bg-gradient-to-r from-clay-400/60 via-clay-100 to-transparent" />

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <Feature
            step="01"
            title="Elegí servicio y horario"
            body="Cada servicio tiene su duración. Solo ves los horarios libres."
          />
          <Feature
            step="02"
            title="Confirmás"
            body="Te llega un correo de confirmación al instante."
          />
          <Feature
            step="03"
            title="Te recordamos"
            body="Un aviso 24 horas antes para que no se te pase."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({
  step,
  title,
  body,
}: {
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <span className="font-display text-sm text-clay-400">{step}</span>
      <h3 className="mt-1 font-display text-xl font-500">{title}</h3>
      <p className="mt-2 text-sm text-ink/65">{body}</p>
    </div>
  );
}
