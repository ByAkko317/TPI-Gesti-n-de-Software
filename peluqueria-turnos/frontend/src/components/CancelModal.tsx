import { useState } from "react";
import type { Appointment } from "../types";

interface CancelModalProps {
  appointment: Appointment;
  // Si el comentario es obligatorio (caso admin).
  commentRequired?: boolean;
  submitting?: boolean;
  error?: string | null;
  onConfirm: (comment: string | null) => void;
  onClose: () => void;
}

export function CancelModal({
  appointment,
  commentRequired,
  submitting,
  error,
  onConfirm,
  onClose,
}: CancelModalProps) {
  const [comment, setComment] = useState("");

  const trimmed = comment.trim();
  const canSubmit = !commentRequired || trimmed.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-cream p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl font-500">Cancelar turno</h2>
        <p className="mt-2 text-sm text-ink/70">
          {appointment.service.name} ·{" "}
          {new Date(appointment.start_at).toLocaleString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-500 text-ink/80">
            Comentario {commentRequired ? "(obligatorio)" : "(opcional)"}
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-clay-100 bg-white px-3 py-2 outline-none focus:border-clay-400 focus:ring-2 focus:ring-clay-400/20"
            placeholder="Motivo de la cancelación…"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2 font-500 text-ink/70 transition hover:bg-clay-50"
          >
            Volver
          </button>
          <button
            onClick={() => onConfirm(trimmed || null)}
            disabled={!canSubmit || submitting}
            className="rounded-full bg-clay-500 px-5 py-2 font-500 text-cream transition hover:bg-clay-600 disabled:opacity-50"
          >
            {submitting ? "Cancelando…" : "Confirmar cancelación"}
          </button>
        </div>
      </div>
    </div>
  );
}
