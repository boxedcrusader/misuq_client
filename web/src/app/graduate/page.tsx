import { GraduateFlow } from "@/components/GraduateFlow";

// Mirrors /capture, /send, /report-back's route shape — a bare top-level
// route, no dashboard shell exists yet to nest under.
export default function GraduatePage() {
  return <GraduateFlow />;
}
