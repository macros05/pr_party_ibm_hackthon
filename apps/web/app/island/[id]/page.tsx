import { notFound } from "next/navigation";
import { IslandPage } from "@/components/IslandPage";
import { CHARACTER_ORDER } from "@/tokens/characters";
import type { CharacterId } from "@/types/encounter";

interface Params {
  id: string;
}

const VALID_IDS = new Set<string>(CHARACTER_ORDER);

export function generateStaticParams(): Params[] {
  return CHARACTER_ORDER.map((id) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  if (!VALID_IDS.has(id)) notFound();
  return <IslandPage id={id as CharacterId} />;
}
