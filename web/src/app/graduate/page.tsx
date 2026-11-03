import { GraduateFlow } from "@/components/GraduateFlow";
import { RequireAuth } from "@/components/RequireAuth";

// Mirrors /capture, /send, /report-back's route shape — a bare top-level
// route, no dashboard shell exists yet to nest under.
export default function GraduatePage() {
  return (
    <RequireAuth>
      <GraduateFlow />
    </RequireAuth>
  );
}
