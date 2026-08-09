import { ReportBackFlow } from "@/components/ReportBackFlow";

// Mirrors /capture and /send's route shape — a bare top-level route, no
// dashboard shell exists yet to nest under.
export default function ReportBackPage() {
  return <ReportBackFlow />;
}
