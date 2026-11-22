import { redirect } from "next/navigation";

// The public landing page is built in Step 3. Until then, go straight to the app.
export default function Home() {
  redirect("/dashboard");
}
