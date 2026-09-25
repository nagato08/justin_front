export function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="logo"><span className="logo-mark" aria-hidden="true">m.</span>{!compact && <span>ma cuisine</span>}</div>;
}
