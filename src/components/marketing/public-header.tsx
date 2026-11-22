import { getCurrentUser } from "@/server/auth/dal";
import { PublicHeaderBar } from "./public-header-bar";

/** Read-only session check, only to show "Dashboard" instead of "Log in" for signed-in visitors. */
export async function PublicHeader() {
  const user = await getCurrentUser();
  return <PublicHeaderBar signedIn={Boolean(user)} />;
}
