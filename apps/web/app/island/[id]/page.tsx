import { notFound } from "next/navigation";
import { IslandPage } from "@/components/IslandPage";
import { CHARACTER_ORDER } from "@/tokens/characters";
import type { CharacterId } from "@/types/encounter";

interface Params {
  id: string;
}

interface SearchParams {
  fixture?: string;
  github_url?: string;
}

const VALID_IDS = new Set<string>(CHARACTER_ORDER);
const VALID_FIXTURES = new Set<string>(["pr1", "pr2", "pr3"]);

export function generateStaticParams(): Params[] {
  return CHARACTER_ORDER.map((id) => ({ id }));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { fixture = "pr1", github_url } = await searchParams;
  
  if (!VALID_IDS.has(id)) notFound();
  
  // If github_url is provided, use it; otherwise use fixture
  const analysisSource = github_url || (VALID_FIXTURES.has(fixture) ? fixture : "pr1");
  
  return <IslandPage id={id as CharacterId} fixture={analysisSource} />;
}
