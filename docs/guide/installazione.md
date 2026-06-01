# Installazione

CatalystEngine è distribuito come pacchetto npm con build sia **CommonJS** che **ESM**, e include le **type declaration** TypeScript.

## Requisiti

- **Node.js** ≥ 18
- **TypeScript** ≥ 5 (consigliato, ma non obbligatorio: l'engine funziona anche in JavaScript puro)

## Aggiungere al progetto

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

L'intera API pubblica è esposta dal punto di ingresso del pacchetto:

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

Sono esportati anche tutti i tipi e le interfacce — vedi [Interfacce e tipi](/api/interfacce).

## Build dal sorgente

Se lavori sul repository invece che sul pacchetto pubblicato:

```bash
npm install
npm run build   # genera dist/ in formato CJS + ESM con type declarations
npm run dev     # watch mode (ricompila a ogni modifica)
```

La build è gestita da [`tsup`](https://tsup.egoist.dev/).

## Test

La suite usa [Vitest](https://vitest.dev/) e copre il **100%** della codebase (statements, branch, funzioni e righe). Le soglie sono imposte in `vitest.config.ts`: una regressione di copertura fa **fallire la build**.

```bash
npm test               # esegue la suite una volta
npm run test:watch     # watch mode
npm run test:coverage  # report di copertura
```
