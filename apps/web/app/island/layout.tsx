import { SkyBackground } from "@/components/world/SkyBackground";
import { CloudsParallax } from "@/components/world/CloudsParallax";
import { AmbientParticles } from "@/components/world/AmbientParticles";
import { SkyBirds } from "@/components/world/SkyBirds";

/**
 * Persistent layout for the island route. Sky, clouds, birds and
 * ambient motes mount once and stay mounted across child navigations
 * — only the [id]/page.tsx swaps. That's what makes the cross-fade
 * between islands feel like the camera moving inside the same world.
 */
export default function IslandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#0F0F12]">
      <SkyBackground />
      <CloudsParallax />
      <SkyBirds />
      <AmbientParticles />
      {children}
    </div>
  );
}
