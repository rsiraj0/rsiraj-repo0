import { readSession, readOrCreateAnonId } from "@/lib/auth";
import { Workspace } from "@/components/workspace";

export default async function Page() {
  const session = await readSession();
  const anonId = session ? null : await readOrCreateAnonId();
  return (
    <Workspace
      user={session ? { email: session.email } : null}
      anonId={anonId}
    />
  );
}
