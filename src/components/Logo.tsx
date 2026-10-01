export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo">
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="16" fill="currentColor" />
          <path d="M10.5 9v6.2c0 2.2 1.1 3.7 3 4.2V24h2v-4.6c1.9-.5 3-2 3-4.2V9h-1.7v5.4h-1.5V9h-1.6v5.4h-1.5V9h-1.7Zm10.6 0v15h2V9h-2Z" fill="var(--logo-ink)" />
        </svg>
      </span>
      {!compact && <span className="logo-text">ma cuisine</span>}
    </span>
  );
}
