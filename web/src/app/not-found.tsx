import Link from "next/link";
import { PRIMARY_ACTION, SECONDARY_ACTION, StatusScreen } from "@/components/StatusScreen";

// Unmatched URLs. Under `output: "export"` this becomes out/404.html, which
// Cloudflare Pages serves for any path it can't find.
export default function NotFound() {
  return (
    <StatusScreen
      eyebrow="404"
      title="This page wandered off."
      detail="The link may be old, or the page has moved. Your updates and drafts are all still where you left them."
    >
      <Link href="/home" className={PRIMARY_ACTION}>
        Go to your home →
      </Link>
      <Link href="/" className={SECONDARY_ACTION}>
        Back to the Misuq site
      </Link>
    </StatusScreen>
  );
}
