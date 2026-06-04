# Installation

CatalystEngine is distributed as an npm package with both **CommonJS** and **ESM** builds, and includes TypeScript **type declarations**.

## Requirements

- **Node.js** ≥ 18
- **TypeScript** ≥ 5 (recommended, but not required: the engine also works in plain JavaScript)

## Adding it to your project

::: code-group

```bash [npm]
npm install catalyst-engine
```

```bash [pnpm]
pnpm add catalyst-engine
```

```bash [yarn]
yarn add catalyst-engine
```

:::

## Import

The entire public API is exposed from the package entry point:

```typescript
import {
  CatalystEngine,
  StatManager,
  ExperienceManager,
  SkillManager,
  EngineEventBus,
  ModifierType,
} from 'catalyst-engine';
```

All types and interfaces are exported as well — see [Interfaces and types](/api/interfaces).

## Building from source

If you're working on the repository instead of the published package:

```bash
npm install
npm run build   # generates dist/ in CJS + ESM format with type declarations
npm run dev     # watch mode (recompiles on every change)
```

The build is handled by [`tsup`](https://tsup.egoist.dev/).

## Tests

The suite uses [Vitest](https://vitest.dev/) and covers **100%** of the codebase (statements, branches, functions and lines). The thresholds are enforced in `vitest.config.ts`: a coverage regression makes the build **fail**.

```bash
npm test               # runs the suite once
npm run test:watch     # watch mode
npm run test:coverage  # coverage report
```
