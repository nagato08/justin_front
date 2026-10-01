import { AlertCircle, CheckCircle2, Info, Minus, Plus, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import type { Tone } from "../lib/labels";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Alert({ tone = "info", children, onClose }: { tone?: "info" | "success" | "danger" | "warning"; children: ReactNode; onClose?: () => void }) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertCircle;
  return (
    <div className={`alert alert-${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon aria-hidden="true" />
      <div>{children}</div>
      {onClose && (
        <button type="button" className="alert-close" onClick={onClose} aria-label="Masquer le message">
          <X />
        </button>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon"><Icon aria-hidden="true" /></span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return <div className="spinner" role="status"><span aria-hidden="true" /><span className="sr-only">{label}</span></div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function QuantityStepper({ value, onChange, min = 0, label, size = "md" }: { value: number; onChange(value: number): void; min?: number; label: string; size?: "sm" | "md" }) {
  const removes = min === 0 && value <= 1;
  return (
    <div className={`stepper stepper-${size}`} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={removes ? `Retirer ${label}` : "Diminuer la quantité"}>
        {removes ? <Trash2 /> : <Minus />}
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Augmenter la quantité">
        <Plus />
      </button>
    </div>
  );
}

interface ModalProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  onClose(): void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  locked?: boolean;
}

export function Modal({ title, eyebrow, description, onClose, children, size = "md", locked = false }: ModalProps) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const autofocus = dialog.current?.querySelector<HTMLElement>("[autofocus], input, select, textarea");
    (autofocus ?? dialog.current)?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !locked) close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked]);

  return (
    <div className="modal-backdrop" onMouseDown={() => !locked && onClose()}>
      <div
        ref={dialog}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 id={titleId}>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="icon-button ghost" onClick={onClose} disabled={locked} aria-label="Fermer">
            <X />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, children, confirmLabel, busy, tone = "danger", onConfirm, onCancel }: { title: string; children: ReactNode; confirmLabel: string; busy?: boolean; tone?: "danger" | "primary"; onConfirm(): void; onCancel(): void }) {
  return (
    <Modal title={title} onClose={onCancel} size="sm" locked={busy}>
      <p className="modal-text">{children}</p>
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onCancel} disabled={busy}>Retour</button>
        <button type="button" className={`button ${tone}`} onClick={onConfirm} disabled={busy} autoFocus>
          {busy ? "Un instant…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
