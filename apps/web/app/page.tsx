import { redirect } from "next/navigation";

/**
 * The root route is just the entrance to Aegis' island. The old
 * "council map" view has been retired (see `_deprecated/`).
 */
export default function Home() {
  redirect("/island/aegis");
}
