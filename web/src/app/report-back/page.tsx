import { ReportBackFlow } from "@/components/ReportBackFlow";
import { RequireAuth } from "@/components/RequireAuth";

// Mirrors /capture and /send's route shape — a bare top-level route, no
// dashboard shell exists yet to nest under.
export default function ReportBackPage() {
  return (
    <RequireAuth>
      <ReportBackFlow />
    </RequireAuth>
  );
}
