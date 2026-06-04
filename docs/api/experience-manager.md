# ExperienceManager

Manages XP, levels and experience curves. Accessible via `engine.exp`.

```typescript
import { ExperienceManager } from 'catalyst-engine';
```

Conceptual guide: [Experience and levels](/guide/experience).

## Constructor

```typescript
new ExperienceManager(
  config: IExperienceConfig,
  startLevel: number = 1,
  startXP: number = 0
)
```

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `config` | [`IExperienceConfig`](/api/interfaces#iexperienceconfig) | — | Experience curve. |
| `startLevel` | `number` | `1` | Initial level. |
| `startXP` | `number` | `0` | Initial XP within the current level. |

In normal use it is instantiated by the [`CatalystEngine`](/api/catalyst-engine) with the default values only.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `currentLevel` (getter) | `number` | Current level. |
| `currentXP` (getter) | `number` | XP accumulated in the current level. |
| `onLevelUp` | `((result: ILevelUpResult) => void) \| null` | Callback invoked on every level up. |
| `onXPGained` | `((currentXP: number, nextLevelXP: number) => void) \| null` | Callback invoked on every XP gain. |

::: tip
The callbacks are wired by the facade to the [Event Bus](/guide/events). In game code, **listen to the events** `LEVEL_UP` / `XP_GAINED` instead of overriding the callbacks.
:::

## Methods

### `getXPRequirementForLevel()`

```typescript
getXPRequirementForLevel(level: number): number
```

Returns the XP needed to reach the given level (**per-level** threshold, not cumulative). Level `≤ 1` requires `0`.

| Curve type | Result |
| --- | --- |
| `LINEAR` | `baseXP × (level - 1)` |
| `EXPONENTIAL` | `round(baseXP × (level - 1) ^ multiplier)` |
| `CUSTOM_TABLE` | `customTable[level]`, or `Infinity` if missing |

```typescript
engine.exp.getXPRequirementForLevel(3); // threshold for level 3
```

### `gainExperience()`

```typescript
gainExperience(amount: number): ILevelUpResult
```

Adds `amount` XP and gains **all possible levels** in one go, subtracting the thresholds and carrying over the excess. Invokes `onLevelUp` (if any level ups occurred) and then `onXPGained`.

Returns an [`ILevelUpResult`](/api/interfaces#ilevelupresult):

```typescript
const result = engine.exp.gainExperience(250);
// { levelsGained, currentLevel, excessXP, statsUpgraded }
```
