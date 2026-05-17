"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { clearEncounterCache } from "@/lib/api/use-island-analysis-remote";
import { SkyBackground } from "@/components/world/SkyBackground";
import { CloudsParallax } from "@/components/world/CloudsParallax";
import { SkyBirds } from "@/components/world/SkyBirds";
import { AmbientParticles } from "@/components/world/AmbientParticles";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

// 6x6 fbm noise — used to give every parchment surface a tactile grain
const PAPER_NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
       <filter id="n" x="0" y="0">
         <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
         <feColorMatrix type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.30  0 0 0 0 0.16  0 0 0 0.55 0"/>
       </filter>
       <rect width="100%" height="100%" filter="url(#n)" opacity="0.55"/>
     </svg>`,
  );

export function FixtureSelector() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const reduced = usePrefersReducedMotion();

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!githubUrl.trim()) {
      setError("The council needs a pull request URL to convene.");
      return;
    }

    const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    if (!urlPattern.test(githubUrl)) {
      setError(
        "Unrecognized seal. Expected: https://github.com/owner/repo/pull/123",
      );
      return;
    }

    setIsAnalyzing(true);
    clearEncounterCache();
    const encodedUrl = encodeURIComponent(githubUrl);
    router.push(`/island/aegis?github_url=${encodedUrl}`);
  };

  const baseDelay = reduced ? 0 : 0.08;

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#0F0F12]">
      {/* Persistent sky stack — same world as the islands. */}
      <SkyBackground />
      <CloudsParallax />
      <SkyBirds />
      <AmbientParticles />

      {/* Subtle dark vignette at the edges so the central scroll
          stage feels lit from above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 38%, rgba(255,247,224,0.18) 0%, transparent 50%), radial-gradient(120% 100% at 50% 110%, rgba(20,15,8,0.32) 0%, transparent 60%)",
        }}
      />

      {/* The hanging tassel rope above the title plate. */}
      <motion.span
        aria-hidden
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: baseDelay }}
        className="pointer-events-none absolute left-1/2 top-0 z-[6] hidden h-[6vh] w-px -translate-x-1/2 origin-top md:block"
        style={{
          background:
            "linear-gradient(180deg, rgba(60,40,20,0) 0%, #6B4A22 30%, #3D2A11 100%)",
        }}
      />

      <main className="relative z-[10] h-full w-full overflow-hidden">
        <div
          className="mx-auto flex h-full w-full flex-col items-center justify-center gap-8 px-6 py-6 md:gap-12 md:py-8"
          style={{ maxWidth: 880 }}
        >
          {/* ============================================
              I. HERO CREST — title plate that swings in
              ============================================ */}
          <motion.section
            initial={{ y: -60, rotate: -1.5, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{
              duration: 0.9,
              ease: [0.16, 1, 0.3, 1],
              delay: baseDelay,
            }}
            className="relative w-full"
            style={{ transformOrigin: "50% -20%", maxWidth: 680 }}
          >
            <CrestPlate />
          </motion.section>

          {/* ============================================
              II. INTRO — what is PR Party
              ============================================ */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              delay: baseDelay + 0.3,
            }}
            className="w-full"
            style={{ maxWidth: 760 }}
          >
            <IntroCard />
          </motion.section>

          {/* ============================================
              III. GITHUB URL — parchment scroll input
              ============================================ */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.16, 1, 0.3, 1],
              delay: baseDelay + 0.5,
            }}
            className="w-full"
            style={{ maxWidth: 700 }}
          >
            <GithubScroll
              value={githubUrl}
              onChange={(v) => {
                setGithubUrl(v);
                setError(null);
              }}
              onSubmit={handleGitHubSubmit}
              isAnalyzing={isAnalyzing}
              error={error}
            />
          </motion.section>

          {/* Footer — wooden signpost so it reads on the bright sky */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: baseDelay + 0.9 }}
          >
            <FooterPlaque />
          </motion.footer>
        </div>
      </main>

      <style>{`
        @keyframes pr-party-seal-pulse {
          0%, 100% { box-shadow: 0 10px 22px -10px rgba(154,42,31,0.65), 0 0 0 1px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,220,180,0.35), inset 0 -6px 10px rgba(0,0,0,0.35), 0 0 0 0 rgba(224, 187, 114, 0.55); }
          50%      { box-shadow: 0 10px 22px -10px rgba(154,42,31,0.65), 0 0 0 1px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,220,180,0.35), inset 0 -6px 10px rgba(0,0,0,0.35), 0 0 0 14px rgba(224, 187, 114, 0); }
        }
        @keyframes pr-party-ink-blink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes pr-party-banner-sway {
          0%, 100% { transform: rotate(-0.4deg); }
          50%      { transform: rotate(0.4deg); }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   CREST PLATE — central title cartouche
   ─────────────────────────────────────────────────────────── */

function CrestPlate() {
  return (
    <div className="relative">
      {/* Hanging brass ring */}
      <div
        aria-hidden
        className="absolute left-1/2 -top-3 z-[2] h-5 w-5 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #F3CF82 0%, #B0884B 55%, #5A3A14 100%)",
          boxShadow:
            "0 2px 4px rgba(0,0,0,0.45), inset 0 0 6px rgba(255,232,180,0.45)",
        }}
      />

      <div
        className="relative px-8 pt-5 pb-6"
        style={{
          background:
            "linear-gradient(180deg, #F3E4BA 0%, #E9DCB7 40%, #D4C290 100%)",
          borderRadius: "8px",
          boxShadow:
            "0 32px 60px -22px rgba(20,12,4,0.55), 0 6px 14px -6px rgba(20,12,4,0.35), inset 0 0 0 1px rgba(255,240,200,0.55), inset 0 -10px 18px -10px rgba(120,80,30,0.35)",
          animation: "pr-party-banner-sway 9s ease-in-out infinite",
          transformOrigin: "50% 0%",
        }}
      >
        {/* Paper grain */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[8px]"
          style={{
            backgroundImage: `url("${PAPER_NOISE}")`,
            backgroundSize: "220px 220px",
            opacity: 0.35,
            mixBlendMode: "multiply",
          }}
        />

        {/* Inner gold rule */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-3 rounded-[4px]"
          style={{
            border: "1px solid rgba(112, 76, 28, 0.5)",
            boxShadow: "inset 0 0 0 1px rgba(255, 235, 188, 0.5)",
          }}
        />

        {/* Corner fleurons */}
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <CornerFleuron key={c} corner={c} />
        ))}

        {/* Top filigree row */}
        <div className="relative z-[2] mb-2 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-[#5A3F1E]/70" />
          <Diamond />
          <span
            className="font-display text-[11px] uppercase tracking-[0.55em] text-[#3D2A11]"
            style={{
              fontWeight: 600,
              textShadow: "0 1px 0 rgba(255,240,200,0.75)",
            }}
          >
            est. anno mmxxvi
          </span>
          <Diamond />
          <span className="h-px w-12 bg-[#5A3F1E]/70" />
        </div>

        {/* Title */}
        <h1
          className="relative z-[2] text-center font-display"
          style={{
            fontSize: "clamp(2rem, 4.6vw, 3.2rem)",
            lineHeight: 0.95,
            letterSpacing: "0.04em",
            fontWeight: 600,
            color: "#2B1B0A",
            textShadow:
              "0 1px 0 rgba(255,240,200,0.65), 0 2px 0 rgba(160,110,40,0.18), 0 6px 14px rgba(60,30,8,0.18)",
          }}
        >
          <span className="italic font-light" style={{ fontStyle: "italic" }}>
            PR
          </span>{" "}
          Party
        </h1>

        {/* Subtitle */}
        <p
          className="relative z-[2] mt-2 text-center font-display italic text-[#5A3F1E]"
          style={{
            fontSize: "clamp(0.72rem, 1.2vw, 0.9rem)",
            letterSpacing: "0.18em",
          }}
        >
          a council of six convenes upon thy pull request
        </p>

        {/* Bottom filigree row */}
        <div className="relative z-[2] mt-3 flex items-center justify-center gap-2">
          <span className="h-px w-20 bg-[#7C5F2E]/40" />
          <span className="text-[#7C5F2E]/60 text-sm">✦</span>
          <span className="h-px w-20 bg-[#7C5F2E]/40" />
        </div>
      </div>

      {/* Cast shadow band underneath */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -bottom-3 h-3 w-[88%] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse, rgba(20,12,4,0.45), transparent 70%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}

function CornerFleuron({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const pos: React.CSSProperties = {
    position: "absolute",
    width: 22,
    height: 22,
    color: "#7C5F2E",
    opacity: 0.9,
  };
  if (corner === "tl") Object.assign(pos, { left: 10, top: 10 });
  if (corner === "tr")
    Object.assign(pos, { right: 10, top: 10, transform: "scaleX(-1)" });
  if (corner === "bl")
    Object.assign(pos, { left: 10, bottom: 10, transform: "scaleY(-1)" });
  if (corner === "br")
    Object.assign(pos, { right: 10, bottom: 10, transform: "scale(-1,-1)" });

  return (
    <svg viewBox="0 0 24 24" style={pos} aria-hidden>
      <path
        d="M2 2 H10 M2 2 V10 M4 4 Q9 4 9 9 M9 9 C9 6 12 5 14 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="14" cy="7" r="1.3" fill="currentColor" />
    </svg>
  );
}

function Diamond() {
  return (
    <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden>
      <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="#5A3F1E" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────
   FOOTER PLAQUE — dark inscription on the sky
   ─────────────────────────────────────────────────────────── */

function FooterPlaque() {
  return (
    <div
      className="relative px-6 py-2.5 text-center"
      style={{
        background:
          "linear-gradient(180deg, rgba(28,18,8,0.78) 0%, rgba(20,12,4,0.82) 100%)",
        borderRadius: "4px",
        boxShadow:
          "0 14px 28px -14px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(176,136,75,0.55), inset 0 0 0 2px rgba(20,12,4,0.4)",
        backdropFilter: "blur(2px)",
      }}
    >
      <p
        className="font-display uppercase"
        style={{
          color: "#FBE5C0",
          fontSize: "9px",
          letterSpacing: "0.5em",
          fontWeight: 500,
          textShadow: "0 1px 0 rgba(0,0,0,0.6)",
        }}
      >
        <a
          href="https://github.com/OscarM0ntero"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#E0BB72]"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          Oscar Montero
        </a>
        <span aria-hidden style={{ margin: "0 0.5em", color: "#E0BB72" }}>·</span>
        <a
          href="https://github.com/macros05"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#E0BB72]"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          Marcos Morales
        </a>
      </p>
      <p
        className="mt-1.5 font-display italic"
        style={{
          color: "rgba(251,229,192,0.85)",
          fontSize: "12px",
          textShadow: "0 1px 0 rgba(0,0,0,0.55)",
        }}
      >
        IBM Bob Hackathon
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   INTRO CARD — short pitch for what PR Party does
   ─────────────────────────────────────────────────────────── */

const COUNCIL: Array<{
  id: "aegis" | "schema" | "pixel" | "atlas" | "echo" | "codex";
  name: string;
  role: string;
  color: string;
}> = [
  { id: "aegis", name: "Aegis", role: "Security", color: "#C2410C" },
  { id: "schema", name: "Schema", role: "Database", color: "#0E7490" },
  { id: "pixel", name: "Pixel", role: "UX", color: "#BE185D" },
  { id: "atlas", name: "Atlas", role: "Architecture", color: "#4D7C0F" },
  { id: "echo", name: "Echo", role: "Comms", color: "#6D28D9" },
  { id: "codex", name: "Codex", role: "Docs", color: "#B45309" },
];

function IntroCard() {
  return (
    <div
      className="relative px-6 py-5 md:px-10 md:py-6"
      style={{
        background:
          "linear-gradient(180deg, #F3E4BA 0%, #E9DCB7 50%, #D4C290 100%)",
        borderRadius: "6px",
        boxShadow:
          "0 28px 50px -22px rgba(20,12,4,0.6), inset 0 0 0 1px rgba(255,240,200,0.55), inset 0 -10px 18px -10px rgba(120,80,30,0.32)",
      }}
    >
      {/* paper grain */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={{
          backgroundImage: `url("${PAPER_NOISE}")`,
          backgroundSize: "200px 200px",
          opacity: 0.32,
          mixBlendMode: "multiply",
        }}
      />
      {/* inner gold rule */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[3px]"
        style={{ border: "1px solid rgba(112,76,28,0.45)" }}
      />

      <div className="relative">
        <p
          className="mx-auto max-w-[58ch] text-center font-display leading-relaxed"
          style={{
            color: "#2B1B0A",
            fontSize: "0.92rem",
            letterSpacing: "0.005em",
            fontWeight: 400,
            lineHeight: 1.55,
          }}
        >
          <span
            className="font-display italic"
            style={{ color: "#5A3F1E", fontWeight: 600 }}
          >
            PR Party
          </span>{" "}
          is a multi-agent review system. Six AI specialists — each rooted on
          their own floating island — read thy pull request in parallel,
          surface the findings within their domain, and return with a unified
          verdict.
        </p>

        {/* filigree divider */}
        <div className="my-4 flex items-center justify-center gap-3 md:my-5">
          <span
            aria-hidden
            className="h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(112,76,28,0.55) 100%)",
            }}
          />
          <span aria-hidden className="text-[#7C5F2E] text-base">✦</span>
          <span
            className="font-display uppercase text-[10px] tracking-[0.55em]"
            style={{
              color: "#5A3F1E",
              fontWeight: 600,
              textShadow: "0 1px 0 rgba(255,240,200,0.6)",
            }}
          >
            the council
          </span>
          <span aria-hidden className="text-[#7C5F2E] text-base">✦</span>
          <span
            aria-hidden
            className="h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, rgba(112,76,28,0.55) 0%, transparent 100%)",
            }}
          />
        </div>

        {/* six-character lineup — wax-seal gems in a balanced grid */}
        <div className="mx-auto grid max-w-[640px] grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3 md:gap-x-8 md:gap-y-3">
          {COUNCIL.map((c) => (
            <CouncilRow key={c.id} color={c.color} name={c.name} role={c.role} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CouncilRow({
  color,
  name,
  role,
}: {
  color: string;
  name: string;
  role: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <WaxGem color={color} />
      <span className="flex flex-col leading-tight">
        <span
          className="font-display uppercase"
          style={{
            color: "#2B1B0A",
            fontSize: "12px",
            letterSpacing: "0.34em",
            fontWeight: 700,
            textShadow: "0 1px 0 rgba(255,240,200,0.6)",
          }}
        >
          {name}
        </span>
        <span
          className="font-display italic"
          style={{
            color: "#7C5F2E",
            fontSize: "11px",
            letterSpacing: "0.06em",
            marginTop: 2,
          }}
        >
          {role}
        </span>
      </span>
    </div>
  );
}

function WaxGem({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: 22, height: 22 }}
    >
      {/* outer brass ring */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #F3CF82 0%, #B0884B 55%, #5A3A14 100%)",
          boxShadow:
            "0 2px 4px rgba(20,12,4,0.45), inset 0 0 0 0.5px rgba(255,240,200,0.5)",
        }}
      />
      {/* colored gem center */}
      <span
        className="relative rounded-full"
        style={{
          width: 13,
          height: 13,
          background: `radial-gradient(circle at 32% 28%, ${lighten(color)} 0%, ${color} 55%, ${darken(color)} 100%)`,
          boxShadow: `0 0 10px ${color}80, inset 0 1px 1px rgba(255,255,255,0.45), inset 0 -1.5px 2px rgba(0,0,0,0.35)`,
        }}
      />
      {/* glossy highlight */}
      <span
        className="absolute rounded-full"
        style={{
          width: 5,
          height: 3,
          top: 5,
          left: 7,
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.85) 0%, transparent 70%)",
        }}
      />
    </span>
  );
}

function lighten(hex: string) {
  // simple visual tint — add white on top
  return mix(hex, "#FFFFFF", 0.55);
}
function darken(hex: string) {
  return mix(hex, "#1A0F04", 0.55);
}
function mix(a: string, b: string, t: number) {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] * (1 - t) + pb[0] * t);
  const g = Math.round(pa[1] * (1 - t) + pb[1] * t);
  const bl = Math.round(pa[2] * (1 - t) + pb[2] * t);
  return `rgb(${r},${g},${bl})`;
}
function parseHex(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

/* ────────────────────────────────────────────────────────────
   GITHUB SCROLL — input panel
   ─────────────────────────────────────────────────────────── */

function GithubScroll({
  value,
  onChange,
  onSubmit,
  isAnalyzing,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isAnalyzing: boolean;
  error: string | null;
}) {
  return (
    <div className="relative">
      {/* Scroll caps (top dowel) */}
      <ScrollDowel />

      <form
        onSubmit={onSubmit}
        className="relative px-7 py-6 md:px-12 md:py-7"
        style={{
          background:
            "linear-gradient(180deg, #F2E2B6 0%, #E9DCB7 50%, #D4C290 100%)",
          boxShadow:
            "0 24px 50px -22px rgba(20,12,4,0.55), inset 0 0 0 1px rgba(255,240,200,0.55), inset 0 -10px 18px -10px rgba(120,80,30,0.3)",
        }}
      >
        {/* Paper grain */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url("${PAPER_NOISE}")`,
            backgroundSize: "220px 220px",
            opacity: 0.3,
            mixBlendMode: "multiply",
          }}
        />

        {/* Inner ruled rectangle */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-3"
          style={{
            border: "1px solid rgba(112, 76, 28, 0.45)",
          }}
        />

        <div className="relative">
          <div className="mb-1.5 flex items-center gap-3">
            <span className="text-[#5A3F1E] text-base">✦</span>
            <h3
              className="font-display"
              style={{
                color: "#2B1B0A",
                fontSize: "clamp(1.15rem, 2.2vw, 1.4rem)",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Forge Thine Quest
            </h3>
          </div>
          <p
            className="mb-4 font-display italic"
            style={{
              color: "#3D2A11",
              fontSize: "0.85rem",
              lineHeight: 1.5,
            }}
          >
            Inscribe the URL of any GitHub pull request and the council shall
            convene upon it.
          </p>

          <label
            htmlFor="github-url"
            className="block mb-2 font-display text-[10px] uppercase tracking-[0.42em]"
            style={{ color: "#5A3F1E", fontWeight: 600 }}
          >
            Pull Request Seal
          </label>

          <div
            className="relative flex items-stretch"
            style={{
              background: "rgba(255, 248, 224, 0.92)",
              borderRadius: "4px",
              boxShadow:
                "inset 0 0 0 1px rgba(90,63,30,0.7), inset 0 2px 4px rgba(112,76,28,0.22)",
            }}
          >
            <span
              className="flex items-center pl-3 pr-2 font-mono"
              style={{ color: "#5A3F1E", fontSize: "0.9rem" }}
            >
              <span
                aria-hidden
                className="inline-block"
                style={{
                  animation: "pr-party-ink-blink 1.4s steps(2) infinite",
                }}
              >
                ▌
              </span>
            </span>
            <input
              id="github-url"
              type="text"
              placeholder="github.com/owner/repo/pull/123"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={isAnalyzing}
              spellCheck={false}
              className="flex-1 bg-transparent px-1 py-3 font-mono outline-none placeholder:text-[#5A3F1E]/55"
              style={{
                color: "#1F1206",
                fontSize: "0.9rem",
                letterSpacing: "0.01em",
              }}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-start gap-2 rounded-[3px] px-3 py-2 font-display italic"
                style={{
                  background: "rgba(154,42,31,0.12)",
                  border: "1px solid rgba(154,42,31,0.55)",
                  color: "#5C1410",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                <span aria-hidden>⚠</span>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 flex flex-col-reverse items-stretch justify-between gap-4 sm:flex-row sm:items-center">
            <p
              className="font-display italic text-[11px]"
              style={{ color: "#2A1A05", lineHeight: 1.5 }}
            >
              Repo Must be public
            </p>
            <SubmitSeal isAnalyzing={isAnalyzing} disabled={!value.trim()} />
          </div>
        </div>
      </form>

      <ScrollDowel bottom />
    </div>
  );
}

function ScrollDowel({ bottom = false }: { bottom?: boolean }) {
  return (
    <div
      className="relative flex w-full"
      style={{
        height: 16,
        marginTop: bottom ? -2 : 0,
        marginBottom: bottom ? 0 : -2,
        zIndex: 0,
      }}
    >
      {/* cap left */}
      <span
        aria-hidden
        className="h-full"
        style={{
          width: 22,
          background:
            "radial-gradient(ellipse at 30% 50%, #C29A52 0%, #7C5418 60%, #2E1E08 100%)",
          borderRadius: bottom ? "0 0 0 8px" : "8px 0 0 0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
        }}
      />
      <span
        aria-hidden
        className="flex-1 h-full"
        style={{
          background:
            "linear-gradient(180deg, #6F4A20 0%, #4A2F10 50%, #2A1A07 100%)",
          boxShadow: bottom
            ? "inset 0 2px 0 rgba(255,225,170,0.2), 0 4px 10px -4px rgba(0,0,0,0.6)"
            : "inset 0 -2px 0 rgba(255,225,170,0.18), 0 -4px 10px -4px rgba(0,0,0,0.6)",
        }}
      />
      <span
        aria-hidden
        className="h-full"
        style={{
          width: 22,
          background:
            "radial-gradient(ellipse at 70% 50%, #C29A52 0%, #7C5418 60%, #2E1E08 100%)",
          borderRadius: bottom ? "0 0 8px 0" : "0 8px 0 0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
        }}
      />
    </div>
  );
}

function SubmitSeal({
  isAnalyzing,
  disabled,
}: {
  isAnalyzing: boolean;
  disabled: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const active = !disabled && !isAnalyzing && !reduced;
  return (
    <motion.button
      type="submit"
      disabled={disabled || isAnalyzing}
      whileHover={active ? { scale: 1.03, rotate: -1 } : undefined}
      whileTap={
        reduced || disabled || isAnalyzing ? undefined : { scale: 0.97 }
      }
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className="relative inline-flex items-center gap-3 rounded-[4px] px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-55"
      style={{
        background:
          "linear-gradient(180deg, #B53026 0%, #8E1F18 60%, #6A1410 100%)",
        boxShadow:
          "0 10px 22px -10px rgba(154,42,31,0.65), 0 0 0 1px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,220,180,0.35), inset 0 -6px 10px rgba(0,0,0,0.35)",
        animation: active ? "pr-party-seal-pulse 2.6s ease-out infinite" : undefined,
      }}
    >
      <span aria-hidden className="text-[#FBE5C0] text-[12px]">
        ✦
      </span>
      <span
        className="font-display uppercase tracking-[0.34em] text-[12px]"
        style={{
          color: "#FBE5C0",
          textShadow: "0 1px 0 rgba(0,0,0,0.45)",
        }}
      >
        {isAnalyzing ? "Convening…" : "Summon the Council"}
      </span>
    </motion.button>
  );
}

// Made with Bob
