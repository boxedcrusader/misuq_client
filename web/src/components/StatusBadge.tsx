export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border-badge bg-context-fill px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-indigo">
      {status}
    </span>
  );
}
