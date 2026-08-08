export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 132 132" fill="none" aria-hidden="true">
      <circle cx="24" cy="96" r="10" className="fill-dot-1" />
      <circle cx="66" cy="80" r="16" className="fill-dot-2" />
      <circle cx="112" cy="54" r="22" className="fill-dot-3" />
    </svg>
  );
}
