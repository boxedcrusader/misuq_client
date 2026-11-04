// Backend status values (StoryStatus, ContentPieceStatus) shown in founder
// words. STAGED reads "Sent": to the founder, staging IS sending it to their
// small room. Unknown strings (already-human labels) pass through.
const LABELS: Record<string, string> = {
  CAPTURED: "Captured",
  DRAFTED: "Drafted",
  EDITED: "Edited",
  STAGED: "Sent",
  SENT: "Sent",
  REPORTED: "Reported",
  GRADUATED: "Graduated",
  ARCHIVED: "Archived",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border-badge bg-context-fill px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-indigo">
      {LABELS[status] ?? status}
    </span>
  );
}
