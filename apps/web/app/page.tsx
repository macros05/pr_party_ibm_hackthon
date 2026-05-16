import { FixtureSelector } from "@/components/FixtureSelector";

/**
 * Home page with fixture selector.
 * Users choose which PR fixture to analyze (pr1, pr2, or pr3).
 * The selection is passed via URL query parameter to island pages.
 */
export default function Home() {
  return <FixtureSelector />;
}

// Made with Bob
