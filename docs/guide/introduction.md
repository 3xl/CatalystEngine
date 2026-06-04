# Introduction

**CatalystEngine** is a **data-driven**, **polymorphic** and **plug-and-play** progression engine and stats manager for TypeScript and PhaserJS.

The engine is agnostic to both graphics and genre: it can handle the evolution of a fantasy hero, the upgrading of a spaceship's engines, or the development parameters of a strategic faction. Its sole job is to **compute the game math** and **notify the outside world** through a typed Event Bus.

## What it's for

All games with progression share the same problems: stats that change based on buffs/equipment, experience curves, skill trees with prerequisites, and saves. CatalystEngine solves these problems once and for all, in a reusable way that is completely decoupled from the graphics layer.

```typescript
import { CatalystEngine, ModifierType } from 'catalyst-engine';

const engine = new CatalystEngine(
  { hp: 100, attack: 10, defense: 5 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

engine.events.on('LEVEL_UP', ({ currentLevel }) => {
  console.log(`Reached level ${currentLevel}!`);
});

engine.exp.gainExperience(250);
```

## The five architectural decisions

CatalystEngine is built around five precise principles. Each has a dedicated page in the guide.

| Principle | In short |
| --- | --- |
| **Total decoupling (event-driven)** | The logic communicates only through the [`EngineEventBus`](/guide/events). The UI listens, it doesn't query. |
| **Lazy evaluation with dirty flag** | [Stats](/guide/stats) are recalculated only when needed, when the value is requested. |
| **Source-based management** | Modifiers are removed by origin (e.g. `fire_sword`), not by ID. |
| **Graph-based skill tree (DAG)** | Every [skill node](/guide/skill-tree) declares prerequisites, definable via JSON. |
| **Snapshot pattern for persistence** | [`save()`](/guide/persistence) exports a minimal state as pure JSON. |

## The modules

CatalystEngine is a **facade** that coordinates four independent subsystems:

| Module | Responsibility |
| --- | --- |
| [`StatManager`](/api/stat-manager) | Atomic stats and algebraic application of modifiers (`FLAT` / `PERCENT`). |
| [`ExperienceManager`](/api/experience-manager) | XP accumulation, level thresholds (linear/exponential/table) and overflow redistribution. |
| [`SkillManager`](/api/skill-manager) | Skill tree, points to spend and passive modifier injection. |
| [`EngineEventBus`](/api/event-bus) | Typed event bus (`STAT_CHANGED`, `LEVEL_UP`, `XP_GAINED`). |
| [`CatalystEngine`](/api/catalyst-engine) | The facade that ties them together. |

## Next steps

- [Installation](/guide/installation) — add the engine to your project.
- [Quick start](/guide/quick-start) — a complete end-to-end example.
- [Architecture](/guide/architecture) — how the pieces fit together.
