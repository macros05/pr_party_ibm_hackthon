# PR Party — Design & Build Spec

**Hackathon:** IBM Bob Hackathon 2026
**Tema:** Turn idea into impact faster
**Stack obligatorio:** IBM Bob IDE (core), watsonx.ai (Granite), watsonx Orchestrate (opcional)
**Equipo:** 2 personas — Frontend / Backend & Agentes
**Duración objetivo:** 48h efectivas (la idea es viable, no acotamos)
**Presupuesto IA:** 80 Bobcoins (40 + 40), $80 créditos IBM Cloud

---

## 1. Qué estamos construyendo

Un sistema multi-agente que revisa Pull Requests, donde cada subagente es un especialista distinto (seguridad, base de datos, UX, arquitectura, tests, docs) y la salida se presenta como un **encuentro RPG**: un consejo de personajes con clase, nivel, voz propia, daño infligido según severidad y veredicto colectivo.

No es un gimmick. La metáfora RPG resuelve el problema real de las tools de PR review actuales: cuando seis bots te dejan 40 comentarios genéricos, dejas de leerlos. Aquí cada hallazgo tiene un autor con voz, severidad visual y jerarquía, y los desacuerdos entre especialistas salen como diálogo. Es diseño de información disfrazado de juego.

### El pitch en una línea

> Un consejo de seis especialistas revisa tu PR en paralelo, cada uno con su voz y su clase, y emite veredicto colectivo. Code review que vuelves a leer.

### Por qué encaja con el hackathon

- **Multi-agente real** — Orchestrate vende exactamente esto.
- **Bob como core** — análisis técnico profundo del diff y del repo.
- **Granite (watsonx.ai)** — reescritura de hallazgos en seis voces distintas (caso de uso perfecto para tone-shaping).
- **Tema** — "Turn idea into impact faster" = mejores revisiones, menos bugs en main, menos ida y vuelta.
- **Diferenciación** — el 80% del hackathon va a presentar "generador de tests" o "asistente de docs". Esto no.

---

## 2. Los seis personajes

Cada uno es un agente especializado con prompt sistema propio, área de revisión, voz, y reglas de combate.

| # | Personaje | Clase | Domina | Voz |
|---|-----------|-------|--------|-----|
| 1 | **Aegis** | Paladín de Seguridad | Inyecciones, XSS, auth bypass, secretos, deps con CVE, validación de inputs | Formal, paranoico, cita CVEs y OWASP |
| 2 | **Schema** | Maga de Base de Datos | N+1, índices, migraciones peligrosas, locks, transacciones, deadlocks | Seca, técnica, va al grano |
| 3 | **Pixel** | Bardo de UX | A11y, contraste, copy confuso, estados error/loading/empty, mobile | Empática, juguetona, habla del usuario final |
| 4 | **Atlas** | Explorador de Arquitectura | Patrones del repo, capas, coupling, abstracciones, consistencia | Sabia, contextual, cita otros archivos del repo |
| 5 | **Echo** | Sacerdote de Tests | Cobertura, casos edge, asserts vacíos, mocks excesivos, flakiness | Insistente, persuasiva, pregunta "¿y si...?" |
| 6 | **Codex** | Escriba de Documentación | Docs obsoletas, OpenAPI desincronizado, READMEs, comentarios mentirosos | Pedante elegante, cita líneas concretas |

### Mecánicas de combate

Cada hallazgo se traduce a una acción visible. Esto da jerarquía cognitiva: en lugar de 40 bullets idénticos, vemos crits, hits y misses.

| Tipo de hallazgo | Acción RPG | Daño |
|---|---|---|
| Critical (RCE, data loss, auth bypass) | **crit hit** | 80–100 |
| High (bug serio, regresión probable) | **hit** | 40–70 |
| Medium (smell, deuda técnica clara) | **graze** | 15–35 |
| Low (nit, opinión) | **whisper** | 5–10 |
| Nada que reportar | **miss / standing by** | 0 |
| Hallazgo refutado por otro personaje | **parry** | — |

El **HP del PR** empieza en 100. Daño total >= 80 → bloqueado. 50–79 → cambios requeridos. <50 → aprobado con notas.

### Sistema de desacuerdo

Cuando dos personajes contradicen (Atlas dice "está bien, sigue patrón" y Echo dice "pero falta test"), se renderiza como **diálogo cruzado** en el output. Esto es diferenciador y honesto: el dev humano ve el tradeoff, no un veredicto monolítico.

---

## 3. Stack y herramientas de IA

### Stack técnico

| Capa | Tecnología |
|---|---|
| Backend / API | Python 3.11+, FastAPI, uvicorn |
| Agentes IA | IBM Bob (core), watsonx.ai Granite 3.3 (voces), opcional watsonx Orchestrate |
| Streaming | Server-Sent Events (SSE) |
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Componentes | Shadcn/ui (primitivas) |
| Package manager | pnpm o Bun (uno solo, decidir antes de empezar) |
| Repo demo | Node/TypeScript + Express + Postgres (creado por nosotros) |

### Herramientas de IA por persona

**Tu compañero (Backend & Agentes) — 40 Bobcoins**
- **IBM Bob IDE** → herramienta principal. Análisis del diff, generación del prompt sistema maestro, desarrollo del clasificador de findings, motor de daño, pasada de validación tipo Mythos. Aquí van la mayoría de sus Bobcoins.
- **IBM Bob Shell** → automatizar tareas de testing y validación desde CLI (opcional, si sobra tiempo).
- **Claude Code** → todo el código de pegamento: FastAPI scaffolding, clientes de watsonx.ai, manejo de IAM token refresh, SSE setup, fixtures locales. Estas tareas no requieren contexto profundo del repo, no merecen Bobcoins.

**Tú (Frontend) — 40 Bobcoins**
- **Claude Code** → herramienta principal. Toda la implementación de componentes React, animaciones Framer Motion, integración SSE, estados.
- **Skill `frontend-design`** → cargar al inicio de Claude Code. Es lo que diferencia una UI "de IA genérica" de una UI con identidad visual.
- **Artifacts (claude.ai web)** → para mockups visuales iterables antes de codificar. Un Artifact con HTML+Tailwind del Council Hall te permite enseñárselo a tu compañero y ajustar antes de implementar en Next.js real.
- **Claude Projects** → meter el `SPEC.md` como knowledge base. Cualquier conversación de Claude tiene contexto del proyecto sin tener que pegarlo cada vez.
- **IBM Bob (uso planificado)** → 4-5 sesiones cortas y bien narradas, ver sección 5.

### Por qué esta combinación tiene sentido

**Claude Code para el frontend, no Bob**: Bob está optimizado para entender repos grandes y código heredado. El frontend de PR Party se crea desde cero, sin contexto histórico. Claude Code es más ágil para greenfield.

**Bob para el backend**: ahí sí tiene sentido. El backend tiene que entender diffs, asignar findings a personajes según categoría semántica, detectar contradicciones entre análisis. Eso es exactamente lo que Bob hace mejor.

**Granite (watsonx.ai) para el tone-shaping**: barato en tokens, perfecto para reescribir un mismo hallazgo en seis voces. No es el cerebro del sistema, es el "vestidor".

### Skill `frontend-design` — cómo usarlo

Claude Code carga skills automáticamente cuando detecta la tarea. Para asegurarte de que se carga al empezar el frontend, en tu primer mensaje a Claude Code di literalmente:

> "Voy a construir el frontend de una aplicación Next.js 14 con Tailwind y Framer Motion. Es una herramienta de code review con estética dashboard moderno y toques sutiles de RPG. Lee la skill frontend-design antes de empezar a generar componentes."

Eso fuerza la carga. La skill te da convenciones de diseño que evitan el look genérico (paddings consistentes, escalas tipográficas, paletas, animaciones contenidas). El resultado es noche y día comparado con pedirle componentes a pelo.

---

## 4. Arquitectura técnica

### Flujo end-to-end

```
[ Frontend ]
    │
    │ POST /review { repo, pr_number | diff }
    ▼
[ FastAPI Orchestrator ]
    │
    │ 1. Fetch diff + contexto del repo (archivos tocados + dependencias)
    │ 2. Bob analiza el diff UNA vez → produce findings estructurados (JSON)
    │ 3. Bob valida sus propios findings (pasada Mythos-style)
    │ 4. Para cada finding, decide qué personaje(s) lo "poseen"
    │ 5. Granite reescribe cada finding en la voz del personaje
    │ 6. Calcula daño, busca contradicciones entre personajes
    │ 7. Stream de eventos al frontend (SSE)
    ▼
[ Frontend ]
    │
    │ Renderiza encuentro: personajes aparecen uno a uno
    │ Animación de "ataques", barra de HP del PR
    │ Estado final + veredicto + comentarios accionables
```

### Por qué Bob hace dos pasadas (decisión clave actualizada)

Con 80 Bobcoins totales podemos permitirnos un pattern que viene directamente del paper de Mythos Preview de Anthropic: **un agente busca, otro valida**.

- **Pasada 1 — Buscador.** Bob analiza el diff y produce findings clasificados por categoría (JSON estructurado, sin voz).
- **Pasada 2 — Validador.** Otro Bob recibe el JSON y filtra: "este finding es real e interesante, o es ruido". Devuelve los findings confirmados.

Esto reduce drásticamente falsos positivos y los reports salen mucho más sólidos. **Es la misma técnica que Anthropic usa con Mythos para filtrar bugs**. Mencionarlo en el pitch suma puntos.

Granite (tokens baratos, no Bobcoins) hace el último paso: viste cada finding confirmado con la voz del personaje correspondiente. Esto además permite que un finding sea reclamado por dos personajes a la vez (un endpoint de pago con SQL injection es de Aegis Y de Schema).

### Esquema de Findings (contrato entre back y front)

```json
{
  "pr_meta": {
    "repo": "demo-org/demo-app",
    "pr_number": 142,
    "title": "Add user avatar upload",
    "diff_stats": { "files_changed": 3, "additions": 87, "deletions": 12 }
  },
  "encounter": {
    "started_at": "2026-05-15T14:32:11Z",
    "duration_ms": 47230,
    "pr_hp_start": 100,
    "pr_hp_end": 12,
    "verdict": "blocked"
  },
  "characters": [
    {
      "id": "aegis",
      "name": "Aegis",
      "class": "Security Paladin",
      "level": 8,
      "status": "active",
      "findings": [
        {
          "id": "aegis-001",
          "severity": "critical",
          "action": "crit_hit",
          "damage": 88,
          "file": "src/routes/avatar.ts",
          "line_start": 23,
          "line_end": 31,
          "category": "rce",
          "title": "Multer accepts arbitrary file extensions",
          "explanation_raw": "...",
          "explanation_voiced": "I have inspected the multer configuration on line 24...",
          "suggested_patch": "...",
          "references": ["CWE-434", "OWASP A04:2021"]
        }
      ]
    }
  ],
  "dialogues": [
    {
      "between": ["atlas", "echo"],
      "topic": "src/routes/avatar.ts:23",
      "exchanges": [
        { "from": "atlas", "text": "Follows the existing route handler pattern, structurally fine." },
        { "from": "echo", "text": "Structurally fine, but no test exercises the failure path." }
      ]
    }
  ]
}
```

Este contrato es lo que el frontend consume. Backend lo emite (final + parcial via SSE). Cerrar este JSON pronto y no tocarlo después, o el frontend y el backend divergen.

---

## 5. Reparto de trabajo

### Tu compañero — Backend & Agentes (40 Bobcoins)

**Fase 1 (primeras horas)**
- [ ] Setup repo. Estructura monorepo `apps/api/` y `apps/web/`.
- [ ] FastAPI base con endpoints stub: `POST /review`, `GET /encounter/{id}/stream`. *(Claude Code)*
- [ ] Cliente de Bob Shell + cliente de watsonx.ai con IAM token refresh — el token caduca a los 60min. *(Claude Code)*
- [ ] Helpers para fetch de diff (GitHub API si el PR es real, fixture local si es demo). *(Claude Code)*

**Fase 2 (core — aquí entra Bob de verdad)**
- [ ] **[BOB]** Prompt sistema maestro: Bob analiza diff y produce findings JSON estructurados (sin voz, solo técnico). Iterar el prompt con 2-3 PRs distintos hasta clavarlo.
- [ ] **[BOB]** Pasada de validación tipo Mythos: segundo Bob filtra findings reales del ruido.
- [ ] **[BOB]** Clasificador de findings → asignación a personajes (por categoría; si encaja en varias, se asigna a varias).
- [ ] Pipeline Granite: por cada finding y cada personaje asignado, reescribe el texto en la voz del personaje. *(Claude Code orquesta, Granite genera)*
- [ ] **[BOB]** Motor de daño: severidad + categoría → daño numérico → acción. Bob lo razona bien una vez, luego es determinista.
- [ ] **[BOB]** Detector de diálogos: cuando dos personajes tocan el mismo file/line con findings de polaridad opuesta, genera intercambio.

**Fase 3 (integración)**
- [ ] SSE para streaming progresivo. *(Claude Code)*
- [ ] Fixtures: 3 PRs demo preparados con sus respuestas esperadas, para poder hacer demo offline si todo lo demás falla. *(Claude Code)*
- [ ] Logging estructurado de cada llamada a Bob y Granite. *(Claude Code)*
- [ ] Export del directorio `bob_sessions/` con screenshots y markdowns que pide el PDF de IBM.

**Fase 4 (opcional, solo si sobra)**
- [ ] Integración real con webhook de GitHub: PR abierto → encuentro automático → comentario en el PR.
- [ ] watsonx Orchestrate como wrapper: agente "Council" que delega a los seis subagentes.

### Tú — Frontend (40 Bobcoins)

**Fase 0 (antes de tocar código)**
- [ ] Crear un Claude Project con el `SPEC.md` como knowledge. Toda tu sesión de Claude tiene contexto sin pegarlo.
- [ ] Sesión de Artifacts en claude.ai web: 2-3 mockups iterables del Council Hall y del Battlefield. No es código de producción, es para alinear con tu compañero la estética antes de invertir tiempo. 20-30 minutos máximo.
- [ ] Decidir paleta exacta por personaje.

**Fase 1 (Claude Code + frontend-design skill)**
- [ ] Next.js 14 + Tailwind + Framer Motion configurados.
- [ ] Layout base: zona "Council Hall" (lista de personajes), zona "Battlefield" (hallazgos), zona "Verdict" (resumen).
- [ ] Componente `<Character />` con avatar, nombre, clase, nivel, barra de HP del personaje (cosmética).
- [ ] Mock de los datos usando el contrato JSON, antes de que backend tenga nada.

**Fase 2**
- [ ] Pantalla de inicio: input para URL de PR o selector de PRs demo.
- [ ] Animación de "entrada del consejo": personajes aparecen uno a uno con un pequeño efecto.
- [ ] Componente `<Finding />` por tipo de acción: crit_hit con shake + flash rojo, hit normal, miss en gris, parry con efecto cruzado.
- [ ] Barra de HP del PR animada (de 100 a X), color según veredicto final.
- [ ] Render de diálogos entre personajes como intercambio de mensajes.

**Fase 3**
- [ ] Conexión real con backend vía SSE.
- [ ] Estados de carga elegantes (cada personaje "pensando" mientras llega su finding).
- [ ] Vista expandida por finding: código del diff con highlight, patch sugerido en diff format, referencias clickables.
- [ ] Modo "Export markdown" — genera un comentario de PR listo para pegar en GitHub.

**Fase 4 (polish que cambia la percepción del jurado)**
- [ ] Pantalla de "victory screen" o "game over" al terminar el encuentro.
- [ ] Sonidos opcionales (toggle) — crit hit con un "tink", verdict con un sonido grave.
- [ ] Mini-mapa del repo mostrando qué archivos tocó cada personaje.
- [ ] Modo "speedrun" — versión condensada del encuentro para reviewers senior.

### Tu uso de Bob como frontender (40 Bobcoins disponibles)

Cada miembro del equipo tiene que exportar sus task sessions de Bob para el juicio. No puedes llegar al final con tus task sessions vacías. Con 40 Bobcoins tienes margen para 4-5 sesiones serias y bien narradas.

**Sesión 1 — Generador de voces de personajes (hora 1-2)**
Pídele a Bob que genere un JSON con 10-15 ejemplos de "voz" por personaje, basándose en su clase y dominio. Output: `characters_voice_seeds.json` con frases tipo de cada uno. Lo consumes en los mocks del frontend hasta que el backend tenga Granite funcionando. *Reporte limpio: "usé Bob para generar el seed de voces de los seis personajes especialistas".*

**Sesión 2 — Generador del diseño base de personajes (hora 3-4)**
Bob genera el sistema de tokens visuales por personaje: paleta exacta (5 tonos), iconografía sugerida, ejemplos de microcopy para estados. Output: `design_tokens.ts`. *Reporte limpio: "Bob produjo el sistema de tokens visuales y de voz para los seis personajes".*

**Sesión 3 — Revisión arquitectural del frontend (mitad del día 2)**
Cuando tengas Council Hall + 2-3 componentes pesados, pasada de Bob revisando: estructura de carpetas, patrones de hooks, prop drilling, separación de concerns. *Reporte limpio: "Bob auditó la arquitectura del frontend tras la primera ola de componentes y propuso refactors antes de seguir construyendo".*

**Sesión 4 — Revisión de consistencia entre componentes (cuarto final)**
Bob revisa los seis `<Character />`, todos los estados de `<Finding />`, `<Dialogue />` y `<VerdictScreen />` buscando inconsistencias visuales y de API. *Reporte limpio: "Bob revisó la coherencia entre componentes del consejo".*

**Sesión 5 — Auditoría de accesibilidad final (antes de grabar)**
Pasada de Bob sobre el frontend completo: contraste WCAG, ARIA labels, navegación por teclado, focus management. *Reporte muy presentable: "antes de cerrar, Bob auditó la accesibilidad del frontend completo y propuso las correcciones".*

Total: 5 task sessions de Bob para ti, con narrativas claras. Te dejan ~10-15 Bobcoins de margen para imprevistos.

### Sincronización entre los dos

- **Contrato JSON definido en hora 2.** Sin esto la integración será un desastre. Está en la sección 4.
- **Backend devuelve fixtures desde hora 1.** Aunque sean datos hardcoded, el frontend puede empezar a renderizar con datos reales del contrato.
- **Punto de sincronización a la mitad.** Daos 15 minutos en mitad del día 1 para enseñaros lo que tenéis. Vais a descubrir un campo del JSON que falta o sobra.

---

## 6. Cómo trabajar con Claude Code en el frontend (guía práctica)

Esto no es Bob. Claude Code tiene su forma de funcionar mejor. Reglas:

1. **Empieza siempre con la skill cargada.** Tu primer mensaje fuerza la carga (ver prompt inicial en sección 11).
2. **Dale el contrato JSON antes que nada.** Pega el JSON de la sección 4 en tu primer mensaje. Así cuando le pidas `<Character />` ya sabe qué props recibe.
3. **Trabaja hoja-a-raíz, no raíz-a-hoja.** Genera primero `<Character />`, `<Finding />`, `<Dialogue />`. Luego `<CouncilHall />` que los usa. Luego la página que los compone.
4. **Itera sobre componentes individuales con datos reales.** Mejor: "aquí está el componente, aquí el JSON de ejemplo, mejora el estado de crit_hit con un shake más sutil". Peor: "haz que las animaciones sean mejores".
5. **Pídele tipos primero.** "Define los tipos TypeScript del contrato JSON antes de generar componentes." Eso evita que cada componente reinvente sus tipos.
6. **Para animaciones complejas, dale referencias.** Framer Motion tiene mil formas de hacer lo mismo. Descríbeselas concretamente: "el crit_hit hace 3 cosas en secuencia: 200ms de flash rojo en el borde, shake horizontal de 4px tres veces, y la card crece de scale 1 a 1.02 y vuelve. Total 400ms."
7. **Cuando algo no salga bien, pega screenshot del estado actual.** Claude entiende mejor con captura que con descripción.

---

## 7. Repo demo + fixtures

Para la demo necesitamos un repo donde los seis personajes tengan algo que hacer. **No uséis un repo gigante**, será demasiado lento y los hallazgos se diluyen.

### Opción recomendada: crear nuestro propio repo demo

Es lo más controlado. Un proyecto pequeño Node/TypeScript + Express + Postgres con:
- Endpoint de login (vulnerable a SQL injection en una rama)
- Endpoint de upload (vulnerable a path traversal en otra rama)
- Componente React con problemas de a11y (rama UX)
- Migración con DROP TABLE sin backup (rama DB)
- Un PR limpio sin problemas (rama clean) — para enseñar que el sistema no inventa bugs si no los hay

Crear esto cuesta ~2h con Claude Code, garantiza que la demo va a brillar.

---

## 8. Economía de Bobcoins (80 totales)

Reglas que mantenemos:

1. **Toda la programación de pegamento, frontend, scripts auxiliares → Claude Code.** Bob solo para análisis cognitivo y reasoning sobre código.
2. **Activad `/init` en cuanto tengáis el repo del proyecto.** Genera `AGENTS.md` y le da contexto persistente. Reduce coste por sesión siguiente.
3. **Prompt sistema bien escrito una vez, reusado.** No iteres el prompt con Bob a ciegas; iteralo en Claude Code (gratis), y cuando esté bueno, lánzalo a Bob.
4. **Antes de cada llamada cara a Bob, escribe el prompt en un .md.** Léelo dos veces. Mejóralo con "enhance prompt". Luego lánzalo.
5. **Exportad el reporte de sesión después de cada tarea relevante.** Lo necesitamos para entregar y refleja calidad de uso.

Reparto orientativo de Bobcoins:

- **Backend:** ~25 Bobcoins en core (prompt maestro + validador + clasificador + motor de daño), ~10 de margen, ~5 para imprevistos. Total 40.
- **Frontend:** ~6-8 Bobcoins por sesión × 5 sesiones planificadas ≈ 30-40. Margen pequeño pero ajustado.

---

## 9. Mitigaciones de riesgo

### Si Bob falla en demo en vivo
Mantened fixture local con findings JSON ya pre-generados de los 3 PRs demo. Si Bob no responde, el sistema sigue funcionando con esos datos. Nadie del jurado lo notará si la transición es limpia.

### Si watsonx.ai no responde
Fallback a templates fijos por personaje. Los personajes seguirán hablando con su voz aunque sea menos rica que con Granite.

### Si SSE da problemas
Versión sin streaming: front pide POST y recibe todo el JSON cuando termina. Pierde wow factor pero gana fiabilidad. Tener las dos rutas implementadas.

### Si el frontend se complica
El MVP del front es: lista de personajes, lista de findings agrupados por personaje, verdict final. Sin animaciones, sin barras de HP. Todo lo demás es polish.

---

## 10. Demo + Submission

### Estructura del vídeo (3 minutos máximo)

| Tiempo | Sección | Contenido |
|---|---|---|
| 0:00–0:20 | Problema | "Las code reviews humanas se saltan cosas. Los bots dejan 40 warnings que nadie lee. ¿Y si fueran seis especialistas con voz propia?" |
| 0:20–0:45 | UI inicial | Conectamos un PR. Aparece el consejo. |
| 0:45–1:50 | Encuentro en vivo | Aegis encuentra el RCE. Pixel señala el copy de error. Atlas y Echo discuten sobre el patrón. Verdict: blocked. |
| 1:50–2:20 | Cómo está hecho | Bob (buscador + validador, pattern Mythos) → Granite (voces) → orquestación → UI. Mención a Orchestrate como siguiente paso. |
| 2:20–2:50 | Por qué importa | Métrica: code reviews completas en X segundos. Detección de bugs categóricos que un bot genérico no capta. |
| 2:50–3:00 | Cierre | "PR Party. Code review que vuelves a leer." |

Graba con OBS, edita en CapCut o DaVinci. Subtítulos siempre, los jueces ven sin sonido.

### Submission checklist (del PDF oficial)

- [ ] Repo público con código del proyecto.
- [ ] **Carpeta `bob_sessions/`** con screenshots de cada task session de Bob + markdowns exportados (OBLIGATORIO, los dos miembros).
- [ ] README.md con: qué es, cómo correrlo, qué problema resuelve, capturas.
- [ ] Video demo (subido a YouTube unlisted o similar).
- [ ] Pitch deck (slides cortas, 5–8 max).
- [ ] **Ningún API key en el repo.** Ni de IBM Cloud, ni de Bob, ni de GitHub. Usar `.env` y `.gitignore` desde el primer commit. Si IBM detecta credenciales, descalificación automática.
- [ ] Todos los datasets/repos usados son públicos con licencia comercial compatible.

---

## 11. Prompts iniciales

### 11.1 Prompt inicial para tu compañero (Bob IDE, primer mensaje)

Pega esto en Bob IDE en cuanto abras el proyecto. Es el prompt fundacional que le da a Bob contexto completo del proyecto para el resto del hackathon.

```
Soy backend developer en un equipo de 2 personas para el IBM Bob Hackathon
2026. Estamos construyendo "PR Party": un sistema multi-agente que revisa
Pull Requests donde cada subagente es un especialista (seguridad, base de
datos, UX, arquitectura, tests, docs) y la salida se presenta como un
encuentro RPG con personajes que infligen daño al PR según severidad de
hallazgos.

Mi parte es el backend completo:
- API FastAPI (Python 3.11+) que recibe un diff y orquesta el análisis
- Tú (Bob) eres el núcleo cognitivo: analizas el diff y produces findings
  estructurados en JSON, clasificados por categoría (security, db, ux,
  architecture, tests, docs)
- Una segunda pasada tuya valida los findings (pattern Mythos-style:
  buscador + validador) para filtrar ruido
- watsonx.ai con Granite 3.3 reescribe cada finding en la voz del
  personaje correspondiente (eso lo hago fuera de ti, no te preocupes)
- Server-Sent Events stream los findings al frontend según se van produciendo

Antes de empezar a programar, necesito que hagas tres cosas en orden:

1. Genera AGENTS.md con /init para que tengas contexto persistente del
   repo en todas las conversaciones siguientes.

2. Lee el SPEC.md completo del proyecto (lo voy a pegar a continuación o
   está en la raíz del repo) y dime si detectas algún hueco, ambigüedad o
   contradicción en la spec antes de que empiece a construir nada. Quiero
   detectar problemas ahora, no a las 10h.

3. Una vez clara la spec, lo primero que vamos a diseñar juntos es el
   prompt sistema maestro que usarás tú mismo en producción para analizar
   diffs y producir findings JSON. Ese prompt es el corazón del sistema.
   Lo vamos a iterar contra 2-3 diffs de ejemplo del repo demo que voy a
   crear, hasta que produzca findings consistentes y bien clasificados.

Mi presupuesto contigo es de 40 Bobcoins. Quiero usarlos en lo que aporta
contexto profundo: diseño del prompt maestro, validador, clasificador a
personajes, motor de daño, detector de diálogos entre personajes. El resto
(scaffolding FastAPI, clientes HTTP, SSE setup, etc.) lo hago con Claude
Code para no consumirte.

Cuando hayas leído la spec, dame tu evaluación antes de seguir.
```

### 11.2 Prompt inicial para ti (Claude Code, primer mensaje)

Pega esto en Claude Code en cuanto abras el proyecto del frontend. Es el prompt fundacional que carga la skill correcta y le da contexto completo.

```
Voy a construir el frontend de "PR Party": una herramienta de code review
multi-agente para el IBM Bob Hackathon 2026. Pega tu spec completa en mi
contexto: en este Claude Project hay un SPEC.md con todo. Léelo entero
antes de empezar.

Setup técnico:
- Next.js 14 con App Router
- TypeScript estricto
- Tailwind CSS
- Framer Motion para animaciones
- Shadcn/ui para primitivas
- Server-Sent Events para consumir el stream del backend

Estética:
- Dashboard moderno tipo Linear / Vercel / Raycast como base
- Toques sutiles de RPG (NO pixel art, NO fantasy clásico): iconografía
  por personaje, barras de HP, labels tipo "crit hit" pero diseño limpio
- Paleta oscura con un acento por personaje (Aegis rojo/oro, Schema azul,
  Pixel magenta, Atlas verde, Echo violeta, Codex ámbar)
- Animaciones contenidas: un crit hit es un flash + shake de 200ms, no
  fuegos artificiales
- Tipografía: Inter para UI, JetBrains Mono para código

Antes de generar nada, haz lo siguiente en orden:

1. Lee la skill frontend-design. No empieces componentes hasta haberla
   leído. Es esencial para que la UI no salga con look genérico de IA.

2. Lee el SPEC.md del proyecto entero (está en knowledge del Project).
   Presta especial atención al contrato JSON de la sección 4 — los
   componentes van a consumir exactamente ese formato.

3. Genera primero el archivo de tipos TypeScript completo del contrato
   JSON (`types/encounter.ts`). Esos tipos van a ser la base de todos los
   componentes. Lo quiero ver y aprobar antes de tocar un componente.

4. Después generaremos componentes hoja primero (Character, Finding,
   Dialogue), luego ensamblamos vistas (CouncilHall, Battlefield,
   VerdictScreen), y solo al final la página principal. NO me hagas "toda
   la app de una vez", se hace peor.

Reglas de trabajo:
- Cuando te pase datos de ejemplo, úsalos literalmente. No los modifiques
  para que encajen mejor con un componente; el componente debe encajar
  con el dato.
- Si una animación requiere más de 3 líneas en Framer Motion, dame una
  variants externa nombrada antes de inyectarla en el componente.
- Cada componente con varios estados (Finding tiene 5: crit_hit, hit,
  graze, whisper, miss): genera un Storybook-like file de ejemplo
  enseñando los 5 estados con datos hardcoded, para que pueda revisarlos
  visualmente uno a uno.

Para arrancar: léete primero la skill frontend-design y luego el SPEC.md.
Dime que has terminado y propóneme el primer paso concreto.
```

---

## 12. Notas finales

- La idea es viable. El scope grande lo asumimos a sabiendas.
- Lo único negociable a la baja es la cantidad de animaciones del frontend. El motor de personajes y el contrato JSON no se tocan.
- Si en algún momento dudamos entre "más features" y "más polish", siempre polish. Una demo limpia con 4 personajes pega más que una demo rota con 6.
- El reporte de sesión de Bob es parte del juicio. Tratad cada prompt a Bob como si os fueran a leer luego, porque os van a leer.
- Con 80 Bobcoins entre los dos hay margen real, pero no es infinito. Mantened la disciplina de "Claude Code para lo barato, Bob para lo cognitivo".

---

*Última revisión: día 0 del hackathon. Actualizar cuando algo cambie sustancialmente.*
