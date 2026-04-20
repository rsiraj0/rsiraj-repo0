import { readSession } from "@/lib/auth";
import { Workspace } from "@/components/workspace";

export default async function Page() {
  const session = await readSession();
  return <Workspace user={session ? { email: session.email } : null} />;
}
