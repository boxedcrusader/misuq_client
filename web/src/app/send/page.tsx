import { SendFlow } from "@/components/SendFlow";

// Mirrors /capture's route shape — a bare top-level route, no dashboard
// shell exists yet to nest under.
export default function SendPage() {
  return <SendFlow />;
}
