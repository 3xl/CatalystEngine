# CatalystEngine

Un motore di progressione e gestione delle statistiche **data-driven**, **polimorfo** e **plug-and-play** per TypeScript e PhaserJS.

L'engine è agnostico rispetto alla grafica e al genere: può gestire l'evoluzione di un eroe fantasy, il potenziamento dei motori di un'astronave, o i parametri di sviluppo di una fazione strategica. Il suo compito è calcolare la matematica di gioco e notificare il mondo esterno tramite un Event Bus tipizzato.

## Decisioni architetturali

- **Disaccoppiamento totale (event-driven):** la logica comunica solo tramite l'`EngineEventBus`. La UI (Phaser o altro) si limita ad ascoltare gli eventi.
- **Lazy evaluation con dirty flag:** le statistiche vengono ricalcolate solo quando un modificatore cambia e solo nel momento in cui il valore viene richiesto.
- **Gestione per sorgente:** i modificatori si rimuovono in base alla loro origine (es. `spada_di_fuoco`), non tramite ID astratti.
- **Albero delle skill a grafo (DAG):** ogni nodo dichiara prerequisiti di livello e di sblocco, definibili via JSON.
- **Snapshot pattern per la persistenza:** `save()` esporta uno stato minimo (XP, livelli base, skill sbloccate) in JSON puro, ideale per `LocalStorage` o database.

## Moduli

| Modulo | Responsabilità |
| --- | --- |
| `StatManager` | Statistiche atomiche e applicazione algebrica dei modificatori (`FLAT` / `PERCENT`). |
| `ExperienceManager` | Accumulo XP, soglie di livello (lineari/esponenziali/tabella) e ridistribuzione dell'eccedenza. |
| `SkillManager` | Albero delle abilità, punti da spendere e iniezione dei modificatori passivi. |
| `EngineEventBus` | Bus di eventi tipizzato (`STAT_CHANGED`, `LEVEL_UP`, `XP_GAINED`). |
| `CatalystEngine` | Facade che coordina i moduli. |

## Struttura del progetto

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
npm run build   # genera dist/ in formato CJS + ESM con type declarations
npm run dev     # watch mode
```

## Test

La suite di test usa [Vitest](https://vitest.dev/) e copre il **100%** della codebase
(statements, branch, funzioni e righe). Le soglie di copertura sono imposte in
`vitest.config.ts`, quindi una regressione di copertura fa fallire la build.

```bash
npm test            # esegue la suite una volta
npm run test:watch  # watch mode
npm run test:coverage  # esegue la suite con report di copertura
```

## Esempio d'uso

```typescript
import { CatalystEngine, ModifierType } from 'catalyst-engine';

const engine = new CatalystEngine(
    { hp: 100, attack: 10, defense: 5 },
    { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

engine.events.on('LEVEL_UP', ({ currentLevel }) => {
    console.log(`Salito al livello ${currentLevel}!`);
});

engine.exp.gainExperience(250);

engine.addModifier('attack', {
    id: 'fire_sword_dmg',
    source: 'spada_di_fuoco',
    type: ModifierType.FLAT,
    value: 15
});

const save = engine.save();   // stato minimo serializzabile
engine.load(save);            // ripristino
```
