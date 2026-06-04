# SkillManager

Manages the skill tree (DAG), skill points and the injection of passive modifiers. Accessible via `engine.skills`.

```typescript
import { SkillManager } from 'catalyst-engine';
```

Conceptual guide: [Skill tree](/guide/skill-tree).

## Constructor

```typescript
new SkillManager(statManager: StatManager, eventBus: EngineEventBus)
```

Receives **by dependency injection** the `StatManager` (to inject the passive modifiers) and the `EngineEventBus` (to emit `STAT_CHANGED`). Instantiated automatically by the [`CatalystEngine`](/api/catalyst-engine).

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `skillPoints` (getter) | `number` | Available skill points. |

## Methods

### `loadSkillTree()`

```typescript
loadSkillTree(config: ISkillNode[]): void
```

Loads the tree nodes. Each node is cloned with `currentLevel` forced to `0`.

```typescript
engine.skills.loadSkillTree(skillTreeJson);
```

### `addSkillPoints()`

```typescript
addSkillPoints(points: number): void
```

Adds spendable skill points. The facade automatically adds `2` of them for each level gained.

### `getSkill()`

```typescript
getSkill(skillId: string): ISkillNode | undefined
```

Returns the skill node, or `undefined` if it does not exist.

### `upgradeSkill()`

```typescript
upgradeSkill(skillId: string, playerLevel: number): ISkillUnlockResult
```

Attempts to upgrade the skill by one level. It runs the checks in order and returns an [`ISkillUnlockResult`](/api/interfaces#iskillunlockresult). On success: it deducts the points, increments `currentLevel`, injects/updates the passive modifiers (for `PASSIVE` skills) and emits `STAT_CHANGED`.

| Failure `reason` | Cause |
| --- | --- |
| `NOT_FOUND` | skill does not exist |
| `MAX_LEVEL` | already at maximum level |
| `NO_POINTS` | not enough points |
| `LOW_LEVEL` | player level too low |
| `MISSING_PREREQUISITES` | prerequisite not unlocked |

```typescript
const res = engine.skills.upgradeSkill('brute_force', engine.exp.currentLevel);
if (!res.success) console.log(res.reason);
```

### `exportState()`

```typescript
exportState(): { unspentPoints: number; unlockedSkills: Record<string, number> }
```

Exports unspent points and unlocked skills (`id → level`), including only those with `currentLevel > 0`. Used by [`save()`](/api/catalyst-engine#save).

### `importState()`

```typescript
importState(state: { unspentPoints: number; unlockedSkills: Record<string, number> }): void
```

Restores skill points and levels, first resetting the entire tree, and **re-injects the passive modifiers** into the stats. Used by [`load()`](/api/catalyst-engine#load).
