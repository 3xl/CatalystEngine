# Experience and levels

The [`ExperienceManager`](/api/experience-manager) accumulates XP, computes level thresholds according to a configurable curve, and handles **chained level ups**.

## Curve configuration

At creation time you provide an [`IExperienceConfig`](/api/interfaces#iexperienceconfig):

```typescript
interface IExperienceConfig {
  type: 'LINEAR' | 'EXPONENTIAL' | 'CUSTOM_TABLE';
  baseXP: number;
  multiplier: number;
  customTable?: number[];
}
```

### The three curves

| Type | Formula for the threshold of level `L` (with `L > 1`) |
| --- | --- |
| `LINEAR` | `baseXP × (L - 1)` |
| `EXPONENTIAL` | `round(baseXP × (L - 1) ^ multiplier)` |
| `CUSTOM_TABLE` | `customTable[L]` (if absent → `Infinity`, level unreachable) |

Level 1 always requires `0` XP. The thresholds are **per-level** (XP needed to go from level `L-1` to level `L`), not cumulative.

```typescript
const engine = new CatalystEngine(
  { hp: 100 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

engine.exp.getXPRequirementForLevel(2); // 100
engine.exp.getXPRequirementForLevel(3); // round(100 × 2^1.5) ≈ 283
```

## Gaining experience

`gainExperience(amount)` adds XP and raises **all reachable levels** in a single call, returning the excess:

```typescript
const result = engine.exp.gainExperience(250);
// result: ILevelUpResult
// {
//   levelsGained: number,
//   currentLevel: number,
//   excessXP: number,       // XP remaining after the level ups
//   statsUpgraded: {}
// }
```

The algorithm subtracts the threshold on each level-up until the remaining XP is no longer enough: a single `gainExperience` can therefore produce **multiple level ups** if the amount is large.

## The callbacks

The `ExperienceManager` is decoupled from the rest: it does not emit events on its own, it exposes **two callbacks** that the [facade](/guide/architecture) wires to the Event Bus.

```typescript
exp.onLevelUp = (result: ILevelUpResult) => { /* ... */ };
exp.onXPGained = (currentXP: number, nextLevelXP: number) => { /* ... */ };
```

In normal use you **don't touch them**: the `CatalystEngine` sets them up in the constructor like this:

- `onLevelUp` → assigns `levelsGained × 2` skill points and emits `LEVEL_UP`;
- `onXPGained` → emits `XP_GAINED` with the progress percentage toward the next level.

So, from the point of view of your game code, all you need to do is **listen to the events**:

```typescript
engine.events.on('LEVEL_UP', ({ currentLevel, levelsGained, excessXP }) => {
  console.log(`You gained ${levelsGained} levels! You are now at level ${currentLevel}.`);
});

engine.events.on('XP_GAINED', ({ currentXP, nextRequiredXP, percentage }) => {
  updateXpBar(percentage); // 0..1
});
```

## Current level and XP

```typescript
engine.exp.currentLevel; // number (read-only)
engine.exp.currentXP;    // number (read-only, XP in the current level)
```

## Try it

The XP bar is driven **only** by `XP_GAINED.percentage` and the level-up animation by `LEVEL_UP`: the UI never queries the engine. Try **+1000 XP** from level 1 to see a **chained level-up** (several levels at once) — also watch the skill points rise by 2 per level.

<Demo name="xp-levelup" title="XP & Level Up — event-driven UI" :height="320" />
