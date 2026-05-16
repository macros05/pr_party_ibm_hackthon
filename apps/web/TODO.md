# PR Party — Estado y plan (full stack)

> Hackathon IBM Bob 2026. Monorepo con frontend (`apps/web/`), backend FastAPI (`backend/`), scripts de generación de assets (`scripts/`) y fixtures de PRs (`fixtures/`). Este doc cubre TODO el proyecto.

## Punto de partida

### Frontend (`apps/web/`)
- App de un solo flujo: el usuario aterriza en `/`, que hoy **redirige** a `/island/aegis` y muestra la vista de un miembro del council (isla flotante + panel con findings) con datos de demo hardcoded.
- Navegación entre los 6 personajes por chevrons o flechas izquierda/derecha del teclado; el sky/clouds/birds/particles persisten porque viven en `app/island/layout.tsx`, así que el cambio de isla se lee como un crossfade dentro del mismo mundo.
- Por isla se reproduce un script local: 1.8 s `scanning` → `analyzing` (los findings caen con espacio de 2.4 s) → `done`. El verdict del robot se deriva del peor severity (`critical` → hit, vacío → victory, resto → neutral).
- Assets servidos estáticos:
  - 6 islas painterly en [public/islands/<id>.png](public/islands/) (1376×768).
  - 6 sets de sprites en `public/sprites/<id>/animations/<anim>/south/frame_NNN.png` con `manifest.json` v2 (frame_size 92×92).
  - 6 retratos sueltos en `public/characters/<id>.png` (NO usados en la vista actual — útiles para el menú).
- Stack: Next 16.2.6 (App Router) · React 19.2.4 · Tailwind v4 · motion v12 · TypeScript estricto · `pnpm` con `pnpm-workspace.yaml`. ESLint flat (v9).
- Rutas activas:
  - `/` → redirect a `/island/aegis` (a sustituir por menú).
  - `/island/[id]` con `id ∈ {aegis,schema,pixel,atlas,echo,codex}` (statically generated).
  - `/preview/character` — showcase legacy del SVG `AegisIsland`; no entra en el flujo principal.

### Backend (`backend/`)
- FastAPI 0.109 + pydantic v2, Python 3.11+. Entrada en [backend/app/main.py](../../backend/app/main.py).
- Endpoints:
  - `GET /` — health.
  - `GET /fixtures` — lista `["pr1","pr2","pr3"]`.
  - `POST /analyze` — SSE; eventos `finding` (cada 0.5 s), `dialogue`, `complete`, `error`.
  - `POST /analyze/sync` — devuelve `EncounterResult` completo en un solo response.
  - **GitHub real NO implementado**: cualquier request sin `use_fixture` devuelve 501.
- Pipeline (orchestrator en [backend/app/services/orchestrator.py](../../backend/app/services/orchestrator.py)):
  1. `BobClient.searcher_pass()` — POST `<BOB_API_URL>/generate` con `prompts/bob_searcher.md` → `findings_raw[]`.
  2. `BobClient.validator_pass()` — POST `/generate` con `prompts/bob_validator.md` → `findings_validated[]`.
  3. `FindingsClassifier.classify_findings()` — keyword-scoring rule-based, asigna `character_id` con fallback por severity ([services/classifier.py](../../backend/app/services/classifier.py)).
  4. `VoiceRewriter.rewrite_findings()` — un round-trip a Granite (`ibm/granite-3-3-8b-instruct`) por finding para producir `character_dialogue` ([services/voice_rewriter.py](../../backend/app/services/voice_rewriter.py)).
  5. Cálculo de damage/verdict: ≥80 → `blocked`, 50-79 → `changes_required`, <50 → `approved`. HP = `max(0, 100 - total_damage)`.
  6. `_generate_dialogues()` — heurística simple: si ≥2 personajes con ≥2 findings cada uno, fabrica UN diálogo entre los primeros dos.
- Tests: 26/26 core verdes (models, classifier, fixture_loader); test_api con issues de env según `COMPLETION_SUMMARY.md`. Comando: `pytest tests/ -v`.

### Generación de assets (`scripts/`)
- `scripts/pixellab/` — wrapper Python sobre PixelLab v2 REST API (sprites de personajes y animaciones). Auth: `PIXELLAB_API_TOKEN` leído desde `apps/web/.env.local`.
- `scripts/gemini/` — wrapper Python sobre Gemini `gemini-2.5-flash-image` (islas painterly). Auth: `GEMINI_API_KEY` desde el mismo `.env.local`.
- Entry points: `scripts/phase1.py` (calibración Aegis), `scripts/phase1_finish.py`.
- `scripts/.venv/` — virtualenv local; no commitear nada nuevo aquí.

### Fixtures (`fixtures/`)
- 3 PRs sintéticos: `pr1_security_critical/`, `pr2_mixed_issues/`, `pr3_clean_code/`.
- Cada uno trae `README.md`, `diff.patch`, `package.json`, `context/*`, `expected_findings_raw.json`, `expected_findings_validated.json`.
- El loader hace `(fixture_dir / "diff.patch").read_text()` — confirmé que los `.patch` SÍ existen aunque el `ls` que hago en este doc al inicio los omite (son archivos sin extensión visible en algunos listados).

### Documentación raíz
- [PR_PARTY_SPEC.md](../../PR_PARTY_SPEC.md), [DECISIONS.md](../../DECISIONS.md), [AGENTS.md](../../AGENTS.md), [README.md](../../README.md), [COMPLETION_SUMMARY.md](../../COMPLETION_SUMMARY.md), [history.md](../../history.md), [validation/pr1_prompt_analysis.md](../../validation/pr1_prompt_analysis.md).

## Lo que YA está hecho

### Frontend — Council (las pantallas `/island/[id]`)
- Composición 60/40 con CSS vars (`--world-w`, `--world-h`, `--panel-top`, `--panel-left`) en [components/IslandPage.tsx](components/IslandPage.tsx).
- Cursor-tilt sobre la columna izquierda (rotateX/rotateY ±2°) coalescido por rAF.
- Crossfade entre islas: blur+scale 0.55 s + light wipe diagonal.
- Preload background del prev/next 2 s después de mount (isla + idle + walk/float).
- Generación estática de los 6 ids vía `generateStaticParams`.

### Frontend — Sprites animados (6 personajes con sus animaciones)
- Loader y reproductor frame-a-frame en [components/sprite/SpriteAnimator.tsx](components/sprite/SpriteAnimator.tsx): paint en `background-image`, sin reconciliación por frame.
- Manifest v2 + fallback chain (`walk` → `float` → `idle`) en [lib/sprites/manifest.ts](lib/sprites/manifest.ts).
- Robot patrulla por 3 waypoints por isla (definidos en porcentaje de imagen): travel→pause(2.5 s)→travel. Verdict overlays one-shot.
- Cache de `HTMLImageElement` y preload-in-background ([lib/sprites/preload.ts](lib/sprites/preload.ts)).
- Animaciones en `public/sprites/manifest.json`: `idle`, `scan`, `hit`, `victory`, `walk` (Echo usa `float` en lugar de `walk`).

### Frontend — Islas flotantes (6 PNG painterly)
- Render con `next/image` `fill` + `objectFit:"fill"` dentro de un wrapper que mide con `ResizeObserver` y publica un `rendered` rect para anclar el robot/highlights en píxeles locales a la imagen.
- Waypoints declarativos en [lib/sprites/island-points.ts](lib/sprites/island-points.ts) (3 por isla).
- Caso especial Codex: extensión SVG del haz de luz hacia arriba para hidear el corte hard del PNG en `y=0`.

### Frontend — Ambiente (cielo, nubes, partículas, pájaros, luciérnagas)
- Cielo en 3 capas con breathing 30 s, sun halo pulsando 8 s, lens-flare diagonal (solo `xl:`).
- 3 capas de nubes parallax (back/mid/front), drift CSS infinito + gust horizontal ligado a [lib/motion/wind.ts](lib/motion/wind.ts).
- Aura accent-tinted (canvas 2D, 30 partículas en espiral) y fireflies (5–8 dots blink+drift) anclados al silhouette.
- 80 motes cream a pantalla completa (canvas 2D), 3 tiers de tamaño, pausa con `visibilitychange`.
- 1–3 pájaros silueta cruzando right→left en bucle.
- Wind cycle global compartido (singleton rAF) con periodo 13 s y peak 1.5× durante gusts de 2 s.

### Frontend — Navegación, transiciones, panel
- Chevrons absolutos + key handler `Arrow*` con guard para inputs ([components/world/IslandNavigator.tsx](components/world/IslandNavigator.tsx)).
- Crossfade ([components/transitions/IslandCrossfade.tsx](components/transitions/IslandCrossfade.tsx)).
- Arrival ripple del robot, shake en verdict `critical`.
- Panel derecho con nameplate, PR header, findings rail (auto-scroll bottom), status footer con barra de progreso 25/65/100%.

### Backend
- Mythos two-pass pattern implementado: Searcher + Validator (Bob).
- IAM token auto-refresh para watsonx.ai (margen 5 min) ([backend/app/clients/watsonx_client.py](../../backend/app/clients/watsonx_client.py)).
- Logging estructurado con `structlog`.
- CORS configurado para `http://localhost:3000,http://localhost:3001`.
- Fixture loader robusto: parsea `README.md` de cada fixture para PR number/title/author, carga `diff.patch`, `package.json`, `context/*`.
- Clasificador con keywords por personaje y fallback por severity.
- Voice rewriter con 6 personalidades cargadas en `CHARACTER_VOICES` dict.
- Suite de tests: `test_models.py`, `test_classifier.py`, `test_fixture_loader.py`, `test_api.py` + `conftest.py`.

### Fixtures
- 3 PRs sintéticos con todo el contexto (diff + package.json + context/) y expected outputs para validar prompts.

### Scripts
- PixelLab v2 client funcional: `phase1.py` ya generó Aegis + animaciones; el resto de personajes se generaron en pases siguientes (los 6 sprites están en `public/sprites/`).
- Gemini client funcional: islas painterly generadas en `public/islands/`.

## Lo que FALTA por hacer

Orden de prioridad estricto. Cada tarea: qué, dónde, por qué, cómo validar.

### 1. Menú de acceso / landing (FRONTEND · prioridad ALTA)
- Qué: reemplazar [app/page.tsx](app/page.tsx) (hoy `redirect("/island/aegis")`) por una landing que presente los 6 personajes y deje entrar al council.
- Archivos a tocar:
  - [app/page.tsx](app/page.tsx) — eliminar redirect, montar `MenuHero` + `CharacterShowcase` + `EnterCouncilCTA`.
  - Crear `apps/web/components/menu/MenuHero.tsx`, `apps/web/components/menu/CharacterShowcase.tsx`, `apps/web/components/menu/EnterCouncilCTA.tsx`.
  - Reutilizar `SkyBackground`, `CloudsParallax`, `AmbientParticles` (y opcionalmente `SkyBirds`) montándolos en `page.tsx` — el layout root [app/layout.tsx](app/layout.tsx) NO los pone (solo lo hace `app/island/layout.tsx`).
  - Retratos sueltos disponibles en `public/characters/<id>.png` (mismo set que las islas pero sin terreno).
  - Tipografía: Fraunces (`font-display`) para título grande, Inter (`font-sans`) para body. Tokens accent en [tokens/characters.ts](tokens/characters.ts).
- Por qué importa: hoy no hay forma de elegir personaje sin teclado/chevron; un nuevo usuario aterriza directo dentro del flujo del council.
- Cómo validar: `npm run dev`, abrir `/`. Debe verse el menú con los 6 personajes; clic en uno navega a `/island/<id>` y arranca el análisis.

### 2. Conexión frontend ↔ backend (FULL-STACK · prioridad ALTA)
- Qué: hoy [lib/demo/character-analysis.ts](lib/demo/character-analysis.ts) y [lib/demo/encounter.ts](lib/demo/encounter.ts) son la única fuente. El backend existe y emite `EncounterResult` via `/analyze/sync` o SSE via `/analyze`. **El contrato NO matchea** entre [types/encounter.ts](types/encounter.ts) (frontend) y [backend/app/models.py](../../backend/app/models.py).
- Diferencias clave del schema (backend → frontend):
  - `description` ⟶ `explanation_raw`
  - `character_dialogue` ⟶ `explanation_voiced`
  - `file_path` ⟶ `file`
  - `damage_type` ⟶ `action`
  - backend NO emite `category` ni `references` ni `pr_meta.repo`/`pr_meta.diff_stats` (rellenar con defaults).
  - backend agrupa findings en `EncounterResult.findings[]` (sin agrupar por personaje); el frontend per-isla filtra por `character_id`.
  - backend verdict `approved` ↔ frontend `approved_with_notes` (verificar mapping).
  - backend HP: 0..100; frontend usa `pr_hp_start: 220`. **[VERIFICAR]** qué escala se quiere mostrar.
- Archivos a tocar:
  - Crear `apps/web/lib/api/client.ts` con `fetchEncounter(fixture)` (POST sync) o `streamEncounter(fixture)` (EventSource sobre SSE).
  - Crear `apps/web/lib/api/adapter.ts` que mapee backend → `Finding` del frontend.
  - Crear o reemplazar `useIslandAnalysis(id)` con una versión que llame al backend (manteniendo la misma forma de `IslandState`) o un wrapper `useIslandAnalysisRemote(id)`.
  - Añadir `NEXT_PUBLIC_API_URL` a [.env.local](.env.local) (default sugerido `http://localhost:8000`).
  - Backend: confirmar CORS en `backend/app/config.py` (ya incluye `http://localhost:3000`).
  - **NO TOCAR** [types/encounter.ts](types/encounter.ts) ni los archivos de demo — la demo sigue siendo fallback offline.
- Por qué importa: el demo es estático; el backend con Bob/Granite/Watson hace el análisis real con fixtures pr1/pr2/pr3.
- Cómo validar: con backend corriendo en :8000, `/island/aegis?fixture=pr1` pinta findings reales en orden; sin backend, degrada al demo.

### 3. Selector de PR (FULL-STACK · prioridad ALTA, depende de 2)
- Qué: hoy el `pr_meta` es fijo (`acme/payments-api #482`). Hace falta input para elegir fixture (`pr1`/`pr2`/`pr3`) o repo+PR real.
- Archivos a tocar:
  - En la landing (tarea 1): selector de fixture o input `owner/repo#PR`.
  - Pasar `pr_number`/`use_fixture` por query param (`/island/[id]?fixture=pr2`) o context global.
  - Endpoint `GET /fixtures` del backend ya está listo.
- Cómo validar: cambiar fixture en la UI dispara re-fetch y findings nuevos.

### 4. GitHub API integration (BACKEND · prioridad ALTA si el demo lo necesita)
- Qué: en [backend/app/main.py:104](../../backend/app/main.py#L104) hay un `TODO: Load from GitHub API`. Sin `use_fixture`, ambos endpoints devuelven 501.
- Archivos a tocar:
  - Crear `backend/app/services/github_loader.py` que use `PyGithub` (ya en `requirements.txt`) + `settings.github_token` para traer diff + package.json + contexto de un PR real.
  - En `main.py` (líneas 92-108 y 193-208): rama `if request.use_fixture else github_loader.load_pr(...)`.
  - Manejar rate-limit y PRs grandes (paginación, diff truncation).
- Por qué importa: sin esto solo se pueden demostrar 3 PRs sintéticos.
- Cómo validar: `POST /analyze/sync {"pr_number": N, "repo_owner": "X", "repo_name": "Y"}` con `GITHUB_TOKEN` configurado devuelve `EncounterResult` real.

### 5. Pantalla post-análisis / verdict (FRONTEND · prioridad MEDIA)
- Qué: cuando `phase === "done"` el panel se queda con la lista de findings y la barra a 100% — no hay CTA para "ver siguiente", "volver al menú" ni "ver verdict global".
- Opciones a definir con el equipo:
  - **A** — botón "Next council seat" que avanza al siguiente id.
  - **B** — overlay "Verdict ready" con stats agregadas (total findings, severity breakdown, HP final) — necesita conocer findings de los 6.
  - **C** — volver al menú con check visual por personaje ya revisado.
- Archivos a tocar:
  - [components/character-panel/StatusFooter.tsx](components/character-panel/StatusFooter.tsx) — CTA condicional.
  - O nuevo `components/character-panel/VerdictCard.tsx`.
  - Si **B**: agregación necesita un store global o fetch único en el menú que cachee `EncounterResult` por session.

### 6. Responsive móvil <900px (FRONTEND · prioridad MEDIA)
- Qué: las CSS vars en [components/IslandPage.tsx#L180-L201](components/IslandPage.tsx#L180-L201) ya stackean (world 55vh arriba / panel 45vh abajo), PERO:
  - `px-12 pt-12` del nameplate corta texto en `<420px`.
  - Chevrons `left:24`/`right:24` montan sobre la isla (que ahora ocupa 100vw) y compiten con el robot.
  - `clamp(80px,9vw,140px)` del nombre overflowa en ratios estrechos.
- Archivos a tocar:
  - [components/character-panel/CharacterNameplate.tsx](components/character-panel/CharacterNameplate.tsx) — `px-6` default, `xl:px-16`.
  - [components/world/IslandNavigator.tsx](components/world/IslandNavigator.tsx) — en `<900px`, chevrons al bottom del bloque world.
  - [components/character-panel/CharacterPanel.tsx](components/character-panel/CharacterPanel.tsx) — el `boxShadow:"-40px 0 100px"` en mobile pega arriba en lugar de izquierda; variante `borderTop` para layout vertical.
- Cómo validar: DevTools 375×812 (iPhone) y 768×1024 (iPad).

### 7. Limpieza de código huérfano (FRONTEND · prioridad BAJA)
- Verificado: cero imports vivos. Borrable directamente.
  - [apps/web/_deprecated/](apps/web/_deprecated/) — ya excluido en `tsconfig.json`. Genera 1 error de lint que desaparece al borrar.
  - [apps/web/lib/motion/walk-paths.ts](lib/motion/walk-paths.ts) — declarado en spec viejo, sin imports.
  - [apps/web/components/battle/](apps/web/components/battle/) (Effects, FindingsPanel, HUD, Particles, Robot, Tooltip) — sin imports.
- A decidir:
  - [apps/web/app/preview/character/page.tsx](app/preview/character/page.tsx) + [components/islands/AegisIsland.tsx](components/islands/AegisIsland.tsx) + [tokens/level_visuals.ts](tokens/level_visuals.ts) — preview SVG previo a los PNG painterly. NO entra al flujo. **[VERIFICAR]** si se conservan como design reference.

### 8. Bugs de lint sin romper build (FRONTEND · prioridad BAJA)
- 3 errores live `react-hooks/set-state-in-effect` (no bloquean el build):
  - [components/IslandPage.tsx:56](components/IslandPage.tsx#L56) — `setTilt({rx:0,ry:0})` dentro de `useEffect`.
  - [components/sprite/SpriteAnimator.tsx:74](components/sprite/SpriteAnimator.tsx#L74) — `setBuf(null)` al reset.
  - [components/sprite/SpriteRobot.tsx:88](components/sprite/SpriteRobot.tsx#L88) — varios `setOneShotPlayed`/`setStage`.
- Fix sugerido: derivar el estado en render cuando sea posible, o mover a `useLayoutEffect` con guard.
- Cómo validar: `npm run lint` con 0 errores tras el fix.

### 9. Test API del backend roto por env (BACKEND · prioridad BAJA)
- Qué: [COMPLETION_SUMMARY.md](../../COMPLETION_SUMMARY.md) reporta 0/8 en `test_api.py` por problema de variables de entorno (las settings se inicializan al importar `app.main`).
- Archivos a tocar:
  - [backend/tests/conftest.py](../../backend/tests/conftest.py) — añadir `mock_env_vars` autouse o setear `os.environ` antes del import.
  - O hacer las settings lazy en [backend/app/config.py](../../backend/app/config.py).
- Cómo validar: `pytest tests/ -v` con 34/34 verdes.

### 10. Heurística de diálogos del orchestrator (BACKEND · prioridad BAJA)
- Qué: `_generate_dialogues()` en [backend/app/services/orchestrator.py#L56](../../backend/app/services/orchestrator.py#L56) produce UN diálogo plantillado (no es Granite). El frontend no consume `dialogues` todavía.
- Decisión: ¿plantilla o LLM? Si se quiere LLM, hace falta otro prompt de voice_rewriter cruzando dos personajes.
- Cómo validar: contar dialogues en el response y revisar legibilidad.

### 11. Endpoint `/events/{character_id}` no existe (BACKEND · prioridad MEDIA)
- Qué: el frontend per-isla pide findings de UN personaje, pero `POST /analyze*` devuelve todo el batch. Hoy el front filtraría client-side.
- Alternativa: añadir `GET /encounters/{id}/character/{character_id}` o usar un encounter store en memoria para servir slices.
- Por qué importa: hoy cada navegación entre islas dispararía un `/analyze` completo (caro y lento).
- Cómo validar: navegar entre islas no re-ejecuta el pipeline.

### 12. Solo dirección South en sprites (FRONTEND · prioridad BAJA, futuro)
- Qué: manifest solo trae `south`. [lib/sprites/directions.ts](lib/sprites/directions.ts) tiene `vectorToDirection8` listo, pero `SpriteRobot` ignora el facing (comentario explícito en líneas 267-269) porque mirror produciría sprites invertidos raros.
- Cuando se generen las 8 direcciones: pasar `direction` a `SpriteAnimator` y leer subdir `<anim>/<direction>/`.
- Pipeline en [scripts/pixellab/](../../scripts/pixellab/) (requiere `PIXELLAB_API_TOKEN`).

### 13. Halos cyan en bordes de islas (FRONTEND/ASSETS · prioridad BAJA)
- Qué: los PNG `<id>.png` tienen halo cyan tenue residual (artifact del recorte alfa). Más visible cuando el sky es claro.
- Workaround actual: ninguno; los `<id>_raw.png` conservan los originales pre-recorte.
- Fix: re-procesar con matte alfa más agresivo en [scripts/gemini/](../../scripts/gemini/). **[VERIFICAR]** si está en scope.

### 14. Mantenimiento de `scripts/.venv` (SCRIPTS · prioridad BAJA)
- Qué: hay un virtualenv local en `scripts/.venv/` que no está en `.gitignore` (revisar). El `pytest` del backend usa su propio venv.
- Cómo validar: `git status` no debe listar archivos dentro de `.venv/`.

### 15. Documentación raíz desactualizada (DOCS · prioridad BAJA)
- `README.md` raíz aún describe la metáfora a alto nivel pero no menciona la app real, ni cómo correr backend + frontend juntos.
- Falta un quickstart end-to-end (uvicorn + npm run dev + abrir `/`).
- **[VERIFICAR]** si interesa actualizarlo o dejarlo como spec histórico.

## Cómo arrancar

### Frontend
```bash
cd /Users/marcosmor/Desktop/pr_party_ibm_hackthon/apps/web
npm install                       # o pnpm install (hay pnpm-lock.yaml)
npm run dev                       # http://localhost:3000
```
- Build/lint: `npm run build`, `npm run lint`.
- Variables en [.env.local](.env.local):
  - `PIXELLAB_API_TOKEN` — solo para `scripts/pixellab/` (regenerar sprites).
  - `GEMINI_API_KEY` — solo para `scripts/gemini/` (regenerar islas).
  - `NEXT_PUBLIC_API_URL` — **[VERIFICAR]** aún no creada; añadir cuando se conecte backend (tarea 2). Default `http://localhost:8000`.

### Backend
```bash
cd /Users/marcosmor/Desktop/pr_party_ibm_hackthon/backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # editar con WATSONX_API_KEY, WATSONX_PROJECT_ID, BOB_API_KEY, BOB_API_URL
uvicorn app.main:app --reload --port 8000   # http://localhost:8000  (docs: /docs)
```
- Tests: `pytest tests/ -v`. Coverage: `pytest tests/ --cov=app --cov-report=term-missing`.
- Variables obligatorias: `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `WATSONX_URL`, `BOB_API_KEY`, `BOB_API_URL`.
- Opcional: `GITHUB_TOKEN`, `LOG_LEVEL`, `CORS_ORIGINS`, `GRANITE_MODEL_ID`, `GRANITE_MAX_TOKENS`, `GRANITE_TEMPERATURE`.

### Scripts de generación de assets
```bash
cd /Users/marcosmor/Desktop/pr_party_ibm_hackthon/scripts
source .venv/bin/activate                     # o crear uno nuevo
# requiere PIXELLAB_API_TOKEN y/o GEMINI_API_KEY en apps/web/.env.local
python phase1.py                              # calibración (Aegis + 1 island)
```
- **NO** correr generación si no es necesario: cada llamada consume cuota PixelLab/Gemini.

## Reglas duras (no romper)

- **NO tocar** [apps/web/types/encounter.ts](types/encounter.ts) — contrato con el backend.
- **NO tocar** [apps/web/lib/demo/encounter.ts](lib/demo/encounter.ts) ni [lib/demo/character-analysis.ts](lib/demo/character-analysis.ts) — fallback offline; cualquier conexión real va a un módulo nuevo `lib/api/`.
- **NO tocar** [backend/app/models.py](../../backend/app/models.py) — declarado IMMUTABLE en el propio archivo (línea 3). Cambiar el modelo backend obliga a sincronizar el frontend.
- **NO regenerar** assets bajo `apps/web/public/islands/`, `public/sprites/` ni `public/characters/` — ya están y la generación cuesta créditos.
- **NO** añadir librerías pesadas (three.js, GSAP). Stack es `motion` v12; usar `motion/react`.
- Respetar `prefers-reduced-motion` en TODO lo nuevo. Hook: `usePrefersReducedMotion()` en [lib/motion/reduced-motion.ts](lib/motion/reduced-motion.ts).
- Toda animación rAF nueva debe pausarse con Page Visibility API. Hook `usePageVisible()` mismo archivo.
- Mantener tipografía: Fraunces (`font-display`) / Inter (`font-sans`) / JetBrains Mono (`font-mono`).
- Paleta de cielo y accents por personaje vienen de [tokens/characters.ts](tokens/characters.ts) — NO hardcodear.
- Sentence case en strings de UI.
- Backend: no commitear `.env`, `venv/`, `htmlcov/`. Mantener `__init__.py` en `app/`, `app/clients/`, `app/services/`, `tests/`.
- Backend: cualquier cambio en prompts (`prompts/bob_*.md`) requiere revalidar contra `fixtures/*/expected_findings_*.json`.

## Tokens visuales para mantener coherencia

- Sky gradient: `#7AB8DD → #B8DFF5 → #FFE8CC → #FFF1D8` ([components/world/SkyBackground.tsx#L41](components/world/SkyBackground.tsx#L41)).
- Texto crema principal: `#F5EBDA` (nombre); `#EFE4C9` (`--fg`); `#B6A684` (`--fg-muted`); `#7A6D52` (`--fg-soft`).
- Accents por personaje (de [tokens/characters.ts](tokens/characters.ts)):
  - Aegis `#C2410C` · Schema `#0E7490` · Pixel `#BE185D` · Atlas `#4D7C0F` · Echo `#6D28D9` · Codex `#B45309`.
- Severity colors (de [components/character-panel/FindingsRail.tsx#L13](components/character-panel/FindingsRail.tsx#L13)):
  - critical `#E04C2B` · high `#E0BB72` · medium `#B9D87B` · low `#7DD3E2` · none `#B6A684`.
- Sombras en `:root` de [app/globals.css](app/globals.css): `--shadow-map`, `--shadow-panel`, `--shadow-robot`.
- Fraunces para nombres/display · Inter para UI · JetBrains Mono para code/labels/paths.

## Componentes reutilizables que ya existen

### World (sky / clouds / island / ambient)
- [components/world/SkyBackground.tsx](components/world/SkyBackground.tsx) — `"use client"`. Sin props. Cielo + halo + lens flare.
- [components/world/CloudsParallax.tsx](components/world/CloudsParallax.tsx) — `"use client"`. Sin props. 3 capas drift+gust.
- [components/world/AmbientParticles.tsx](components/world/AmbientParticles.tsx) — `"use client"`. Sin props. Canvas 2D fullscreen, 80 motes.
- [components/world/SkyBirds.tsx](components/world/SkyBirds.tsx) — `"use client"`. Sin props.
- [components/world/Fireflies.tsx](components/world/Fireflies.tsx) — `"use client"`. Props `{cx, cy, accent, radius?, count?}`.
- [components/world/IslandAura.tsx](components/world/IslandAura.tsx) — `"use client"`. Props `{cx, cy, radius?, accent}`.
- [components/world/IslandHighlight.tsx](components/world/IslandHighlight.tsx) — `"use client"`. Props `{x, y, active, accent, size?}`.
- [components/world/FloatingIsland.tsx](components/world/FloatingIsland.tsx) — `"use client"`. Props `{characterId, phase, verdict, tilt?, windRoll?}`.
- [components/world/IslandNavigator.tsx](components/world/IslandNavigator.tsx) — `"use client"`. Props `{current}`.

### Sprite
- [components/sprite/SpriteAnimator.tsx](components/sprite/SpriteAnimator.tsx) — `"use client"`. Props `{character, animation, size, forceLoop?, onComplete?}`. Genérico, sin lógica de patrullaje.
- [components/sprite/SpriteRobot.tsx](components/sprite/SpriteRobot.tsx) — `"use client"`. Props `{characterId, phase, verdict, size, waypoints, paused?, accent, onPauseIndex?}`. Memoizado.
- Overlays: HitOverlay, ScanOverlay, VictoryOverlay (self-mounting/unmounting).

### Panel
- [components/character-panel/CharacterPanel.tsx](components/character-panel/CharacterPanel.tsx) — `"use client"`. Props `{characterId, phase, findings, prMeta}`.
- [components/character-panel/CharacterNameplate.tsx](components/character-panel/CharacterNameplate.tsx) — `"use client"`. Props `{id, phase}`.
- [components/character-panel/PullRequestHeader.tsx](components/character-panel/PullRequestHeader.tsx) — `"use client"`. Props `{characterId, title, repo, prNumber}`.
- [components/character-panel/FindingsRail.tsx](components/character-panel/FindingsRail.tsx) — `"use client"`. Props `{findings, accent, phase}`. Auto-scroll bottom.
- [components/character-panel/StatusFooter.tsx](components/character-panel/StatusFooter.tsx) — `"use client"`. Props `{phase, accent, findingCount}`.

### Transitions
- [components/transitions/IslandCrossfade.tsx](components/transitions/IslandCrossfade.tsx) — `"use client"`. Props `{cacheKey, children}`.

### Hooks/utilities
- [lib/motion/reduced-motion.ts](lib/motion/reduced-motion.ts) — `usePrefersReducedMotion()`, `usePageVisible()`. USAR SIEMPRE.
- [lib/motion/wind.ts](lib/motion/wind.ts) — `useWindMultRef()` (ref, sin re-render), `useWindRoll()` (~12 Hz throttled).
- [lib/sprites/preload.ts](lib/sprites/preload.ts) — `preloadAnimation`, `preloadIsland`, `preloadInBackground`, `getCachedImage`.
- [lib/sprites/manifest.ts](lib/sprites/manifest.ts) — `loadManifest`, `framePathsFor`, `travelAnimationFor`, `resolveAnimation`.
- [lib/sprites/directions.ts](lib/sprites/directions.ts) — `vectorToDirection8(dx,dy)`. NO usado todavía (solo south).

### Backend (servicios y clientes reutilizables)
- [backend/app/clients/bob_client.py](../../backend/app/clients/bob_client.py) — `BobClient.searcher_pass()`, `validator_pass()`. Singleton via `get_bob_client()`.
- [backend/app/clients/watsonx_client.py](../../backend/app/clients/watsonx_client.py) — `WatsonxClient.generate_text(model_id, prompt, ...)`. IAM auto-refresh.
- [backend/app/services/classifier.py](../../backend/app/services/classifier.py) — `FindingsClassifier.classify_findings()`. Sin estado.
- [backend/app/services/voice_rewriter.py](../../backend/app/services/voice_rewriter.py) — `VoiceRewriter.rewrite_findings()`. Usa Granite.
- [backend/app/services/orchestrator.py](../../backend/app/services/orchestrator.py) — `PRAnalysisOrchestrator.analyze_pr()`. Pipeline completo.
- [backend/app/services/fixture_loader.py](../../backend/app/services/fixture_loader.py) — `FixtureLoader.load_fixture(name)`.

## Bugs/deuda conocida

### Frontend
- 3 errores live `react-hooks/set-state-in-effect`: `IslandPage.tsx:56`, `SpriteAnimator.tsx:74`, `SpriteRobot.tsx:88`. Detalle en tarea 8.
- [lib/motion/walk-paths.ts](lib/motion/walk-paths.ts) huérfano (sin imports vivos) — borrable.
- [apps/web/_deprecated/](apps/web/_deprecated/) excluido del tsconfig pero ESLint sí lo escanea (1 error extra).
- `components/battle/` (6 archivos) sin imports vivos. Borrable.
- `app/preview/character/` + `components/islands/AegisIsland.tsx` + `tokens/level_visuals.ts` solo usados por la página de preview legacy.
- Mobile <900px panel apretado y chevrons mal ubicados (tarea 6).
- Solo `south` generado en sprites.
- Halos cyan leves en bordes de las islas painterly.
- `pnpm-lock.yaml` y un eventual `package-lock.json` que pueda generar `npm install` pueden divergir. **[VERIFICAR]** gestor preferido.

### Backend
- `GET /analyze*` sin `use_fixture` devuelve 501 (tarea 4).
- `test_api.py` 0/8 por env (tarea 9).
- `_generate_dialogues()` es plantilla, no LLM (tarea 10).
- Cada navegación entre islas en el frontend dispararía un `/analyze` completo si se llama directo — falta endpoint con slice o cache (tarea 11).
- `BobClient._call_bob()` asume payload `{prompt, max_tokens, system_prompt?}` y response `{text}`. **[VERIFICAR]** que coincide con la API real de Bob — los tipos no están publicados.
- `WatsonxClient.generate_text()` es síncrono dentro de un wrapper async (`model.generate_text()` no es awaitable). En carga alta puede bloquear el event loop.
- Voice rewriter hace UN call a Granite por finding (N findings → N round-trips). Para PRs con muchos findings, latencia lineal y caro.
- `app.on_event("startup")` / `shutdown` están deprecados en FastAPI 0.109 (warning); migrar a lifespan context.
- `fixture_loader` parsea metadata del README con string-split frágil — un cambio de formato lo rompe silenciosamente.
- `from datetime import datetime` + `datetime.utcnow()` está deprecado en Python 3.12; usar `datetime.now(UTC)`.

### Scripts
- `scripts/.venv/` no parece estar en `.gitignore` global. **[VERIFICAR]** y excluir.
- `phase1.py`/`phase1_finish.py` son scripts one-shot; no idempotentes — re-ejecutar puede sobreescribir assets en `apps/web/public/`.

### Fixtures
- Sin tests automáticos que comparen `expected_findings_*.json` contra el output real del orchestrator. El loop de validación de prompts es manual ([validation/pr1_prompt_analysis.md](../../validation/pr1_prompt_analysis.md) cubre solo pr1).

## Estructura del repo (árbol relevante)

```
pr_party_ibm_hackthon/
│
├── apps/web/                              # FRONTEND (Next 16 + React 19 + Tailwind v4)
│   ├── app/
│   │   ├── layout.tsx                     # html/body + fuentes
│   │   ├── page.tsx                       # redirect → /island/aegis  (cambiar a menú)
│   │   ├── globals.css                    # tokens room/parchment/accents, keyframes
│   │   ├── island/
│   │   │   ├── layout.tsx                 # Sky+Clouds+Birds+Particles persistentes
│   │   │   └── [id]/page.tsx              # carga IslandPage por id
│   │   └── preview/character/page.tsx     # legacy preview SVG (no en flujo)
│   ├── components/
│   │   ├── IslandPage.tsx                 # composición 60/40 + cursor tilt
│   │   ├── character-panel/               # nameplate, PR, findings, footer
│   │   ├── islands/AegisIsland.tsx        # SVG legacy (solo /preview)
│   │   ├── sprite/                        # animator, robot, overlays
│   │   ├── transitions/IslandCrossfade.tsx
│   │   ├── world/                         # sky/clouds/island/aura/highlight/birds/fireflies/nav
│   │   └── battle/                        # HUERFANO — borrar
│   ├── lib/
│   │   ├── demo/                          # NO TOCAR — encounter + character-analysis
│   │   ├── motion/                        # reduced-motion, wind, island, walk-paths(huérfano)
│   │   └── sprites/                       # manifest, preload, directions, island-points
│   ├── tokens/
│   │   ├── characters.ts                  # accents, glow, surface, stone, island archetype
│   │   └── level_visuals.ts               # solo usado por /preview/character
│   ├── types/encounter.ts                 # CONTRATO BACKEND — NO TOCAR
│   ├── public/
│   │   ├── characters/<id>.png            # 6 retratos sueltos
│   │   ├── islands/<id>.png               # 6 painterly 1376x768
│   │   └── sprites/manifest.json + <id>/animations/<anim>/south/frame_NNN.png
│   └── _deprecated/                       # excluido en tsconfig — borrar
│
├── backend/                               # BACKEND (FastAPI + watsonx + Bob)
│   ├── app/
│   │   ├── main.py                        # FastAPI app + endpoints
│   │   ├── models.py                      # Pydantic models — INMUTABLE
│   │   ├── config.py                      # Settings (env-driven)
│   │   ├── logging_config.py              # structlog setup
│   │   ├── clients/
│   │   │   ├── bob_client.py              # Mythos two-pass (searcher + validator)
│   │   │   └── watsonx_client.py          # IAM auto-refresh + generate_text
│   │   └── services/
│   │       ├── orchestrator.py            # pipeline analyze_pr()
│   │       ├── classifier.py              # rule-based character assignment
│   │       ├── voice_rewriter.py          # Granite per-finding rewrite
│   │       └── fixture_loader.py          # carga PRs sintéticos
│   ├── tests/                             # 26/26 core pasan; test_api 0/8 (env)
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md, RUN_TESTS.md, TEST_PLAN.md, TESTING_SUMMARY.md
│
├── fixtures/                              # 3 PRs sintéticos
│   ├── pr1_security_critical/
│   ├── pr2_mixed_issues/
│   └── pr3_clean_code/                    # cada uno: README + diff.patch + package.json + context/ + expected_*.json
│
├── prompts/                               # plantillas Bob
│   ├── bob_searcher.md
│   └── bob_validator.md
│
├── scripts/                               # generación de assets
│   ├── pixellab/                          # PixelLab v2 REST client
│   ├── gemini/                            # Gemini image client
│   ├── phase1.py                          # calibración Aegis
│   └── phase1_finish.py
│
├── validation/pr1_prompt_analysis.md      # análisis manual de pr1
│
└── (root docs)
    ├── README.md                          # pitch del proyecto
    ├── PR_PARTY_SPEC.md                   # spec completa
    ├── DECISIONS.md                       # decisiones de diseño
    ├── AGENTS.md                          # guía para agentes/colaboradores
    ├── COMPLETION_SUMMARY.md              # estado tests backend
    └── history.md                         # log
```

## Cosas marcadas [VERIFICAR]

- Si `/preview/character` + `AegisIsland` + `level_visuals.ts` se conservan como design reference o se borran.
- Default exacto de `NEXT_PUBLIC_API_URL` (sugerido `http://localhost:8000`) y si Bob/watsonx tienen URLs distintas en producción.
- Escala de HP a mostrar: frontend usa `pr_hp_start: 220`, backend usa `100`.
- Mapping de verdicts: backend `approved` ↔ frontend `approved_with_notes` (los nombres no coinciden 1:1).
- Si re-procesar islas para eliminar halo cyan está en scope.
- `pnpm` vs `npm` como gestor preferido del equipo.
- Que `BobClient._call_bob()` matchee el shape real del endpoint IBM Bob (`POST /generate` con `{prompt, max_tokens, system_prompt?}` → `{text}`).
- `scripts/.venv/` debería estar en `.gitignore` raíz.
- Si actualizar el `README.md` raíz está en scope o se deja como spec histórico.
