# ExperienceManager

Gestisce XP, livelli e curve di esperienza. Accessibile via `engine.exp`.

```typescript
import { ExperienceManager } from 'catalyst-engine';
```

Guida concettuale: [Esperienza e livelli](/guide/esperienza).

## Costruttore

```typescript
new ExperienceManager(
  config: IExperienceConfig,
  startLevel: number = 1,
  startXP: number = 0
)
```

| Parametro | Tipo | Default | Descrizione |
| --- | --- | --- | --- |
| `config` | [`IExperienceConfig`](/api/interfacce#iexperienceconfig) | — | Curva di esperienza. |
| `startLevel` | `number` | `1` | Livello iniziale. |
| `startXP` | `number` | `0` | XP iniziale nel livello corrente. |

Nell'uso normale viene istanziato dal [`CatalystEngine`](/api/catalyst-engine) con i soli valori di default.

## Proprietà

| Proprietà | Tipo | Descrizione |
| --- | --- | --- |
| `currentLevel` (getter) | `number` | Livello corrente. |
| `currentXP` (getter) | `number` | XP accumulato nel livello corrente. |
| `onLevelUp` | `((result: ILevelUpResult) => void) \| null` | Callback invocato a ogni level up. |
| `onXPGained` | `((currentXP: number, nextLevelXP: number) => void) \| null` | Callback invocato a ogni guadagno di XP. |

::: tip
I callback sono collegati dal facade all'[Event Bus](/guide/eventi). Nel codice di gioco **ascolta gli eventi** `LEVEL_UP` / `XP_GAINED` invece di sovrascrivere i callback.
:::

## Metodi

### `getXPRequirementForLevel()`

```typescript
getXPRequirementForLevel(level: number): number
```

Ritorna l'XP necessario per raggiungere il livello indicato (soglia **per-livello**, non cumulativa). Il livello `≤ 1` richiede `0`.

| Tipo di curva | Risultato |
| --- | --- |
| `LINEAR` | `baseXP × (level - 1)` |
| `EXPONENTIAL` | `round(baseXP × (level - 1) ^ multiplier)` |
| `CUSTOM_TABLE` | `customTable[level]`, oppure `Infinity` se mancante |

```typescript
engine.exp.getXPRequirementForLevel(3); // soglia per il livello 3
```

### `gainExperience()`

```typescript
gainExperience(amount: number): ILevelUpResult
```

Aggiunge `amount` XP e fa salire **tutti i livelli possibili** in un colpo, sottraendo le soglie e riportando l'eccedenza. Invoca `onLevelUp` (se ci sono stati level up) e poi `onXPGained`.

Ritorna un [`ILevelUpResult`](/api/interfacce#ilevelupresult):

```typescript
const result = engine.exp.gainExperience(250);
// { levelsGained, currentLevel, excessXP, statsUpgraded }
```
