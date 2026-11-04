import { ProfileFlow } from "@/components/ProfileFlow";
import { RequireAuth } from "@/components/RequireAuth";

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileFlow />
    </RequireAuth>
  );
}
