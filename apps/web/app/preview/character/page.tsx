import { Character } from "@/components/Character";
import type {
  Character as CharacterType,
  CharacterId,
  CharacterStatus,
  Finding,
} from "@/types/encounter";

const CHARACTER_BASE: Record<
  CharacterId,
  Omit<CharacterType, "status" | "findings">
> = {
  aegis: { id: "aegis", name: "Aegis", class: "Security Paladin", level: 8 },
  schema: { id: "schema", name: "Schema", class: "Database Mage", level: 7 },
  pixel: { id: "pixel", name: "Pixel", class: "UX Bard", level: 6 },
  atlas: { id: "atlas", name: "Atlas", class: "Architecture Ranger", level: 9 },
  echo: { id: "echo", name: "Echo", class: "Test Cleric", level: 7 },
  codex: { id: "codex", name: "Codex", class: "Documentation Scribe", level: 5 },
};

const CHARACTER_ORDER = [
  "aegis",
  "schema",
  "pixel",
  "atlas",
  "echo",
  "codex",
] as const satisfies readonly CharacterId[];

const STATUSES = [
  "idle",
  "thinking",
  "active",
  "done",
] as const satisfies readonly CharacterStatus[];

const STUB_FINDING: Finding = {
  id: "stub",
  severity: "medium",
  action: "graze",
  damage: 25,
  file: "src/example.ts",
  line_start: 10,
  line_end: 12,
  category: "patterns",
  title: "stub finding",
  explanation_raw: "",
  explanation_voiced: "",
  references: [],
};

const DONE_FINDINGS_COUNT: Record<CharacterId, number> = {
  aegis: 3,
  schema: 1,
  pixel: 2,
  atlas: 0,
  echo: 4,
  codex: 1,
};

function buildCharacter(
  id: CharacterId,
  status: CharacterStatus,
): CharacterType {
  const base = CHARACTER_BASE[id];
  const findings: Finding[] =
    status === "done"
      ? Array.from({ length: DONE_FINDINGS_COUNT[id] }, (_, i) => ({
          ...STUB_FINDING,
          id: `${id}-stub-${i}`,
        }))
      : [];
  return { ...base, status, findings };
}

export default function CharacterPreviewPage() {
  return (
    <main className="flex-1 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-soft)]">
            preview · component
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight text-[var(--fg)]">
            Character
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--fg-muted)]">
            Six characters across four lifecycle states. The accent color, icon,
            and HP rail shift per character; the status dot animates per state.
          </p>
        </header>

        <section className="mb-16">
          <SectionLabel>All six · active</SectionLabel>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {CHARACTER_ORDER.map((id) => (
              <Character key={id} character={buildCharacter(id, "active")} />
            ))}
          </div>
        </section>

        {STATUSES.map((status) => (
          <section key={status} className="mb-16">
            <SectionLabel>State · {status}</SectionLabel>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {CHARACTER_ORDER.map((id) => (
                <Character
                  key={`${id}-${status}`}
                  character={buildCharacter(id, status)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-soft)]">
      <span className="h-px flex-1 bg-[var(--border)]" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-[var(--border)]" />
    </h2>
  );
}
