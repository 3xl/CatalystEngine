# CatalystEngine

A **data-driven**, **polymorphic** and **plug-and-play** progression engine and stats manager for TypeScript and PhaserJS.

The engine is agnostic to both graphics and genre: it can handle the evolution of a fantasy hero, the upgrading of a spaceship's engines, or the development parameters of a strategic faction. Its job is to compute the game math and notify the outside world through a typed Event Bus.

## Architectural decisions

- **Total decoupling (event-driven):** the logic communicates only through the `EngineEventBus`. The UI (Phaser or otherwise) merely listens to events.
- **Lazy evaluation with dirty flag:** stats are recalculated only when a modifier changes and only at the moment the value is requested.
- **Source-based management:** modifiers are removed based on their origin (e.g. `fire_sword`), not via abstract IDs.
- **Graph-based skill tree (DAG):** every node declares level and unlock prerequisites, definable via JSON.
- **Snapshot pattern for persistence:** `save()` exports a minimal state (XP, base levels, unlocked skills) as pure JSON, ideal for `LocalStorage` or a database.

## Modules

| Module | Responsibility |
| --- | --- |
| `StatManager` | Atomic stats and algebraic application of modifiers (`FLAT` / `PERCENT`). |
| `ExperienceManager` | XP accumulation, level thresholds (linear/exponential/table) and overflow redistribution. |
| `SkillManager` | Skill tree, points to spend and passive modifier injection. |
| `EngineEventBus` | Typed event bus (`STAT_CHANGED`, `LEVEL_UP`, `XP_GAINED`). |
| `CatalystEngine` | Facade that coordinates the modules. |

## Project structure

```text
catalyst-engine/
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── src/
    ├── index.ts
    ├── CatalystEngine.ts
    ├── interfaces/
    │   ├── index.ts
    │   ├── stats.ts
    │   ├── experience.ts
    │   └── skills.ts
    └── core/
        ├── EngineEventBus.ts
        ├── Stat.ts
        ├── StatManager.ts
        ├── ExperienceManager.ts
        └── SkillManager.ts
```

## Build

```bash
npm install
npm run build   # generates dist/ in CJS + ESM format with type declarations
npm run dev     # watch mode
```

## Tests

The test suite uses [Vitest](https://vitest.dev/) and covers **100%** of the codebase
(statements, branches, functions and lines). Coverage thresholds are enforced in
`vitest.config.ts`, so a coverage regression makes the build fail.

```bash
npm test            # runs the suite once
npm run test:watch  # watch mode
npm run test:coverage  # runs the suite with a coverage report
```

## Usage example

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

engine.addModifier('attack', {
    id: 'fire_sword_dmg',
    source: 'fire_sword',
    type: ModifierType.FLAT,
    value: 15
});

const save = engine.save();   // minimal serializable state
engine.load(save);            // restore
```
