# Interfaces and types

All the public types exported by `catalyst-engine`. They are grouped by domain.

## Stats

### `ModifierType`

```typescript
enum ModifierType {
  FLAT = 'FLAT',       // adds an absolute value
  PERCENT = 'PERCENT', // adds a percentage (additive across modifiers)
}
```

### `IStatModifier`

```typescript
interface IStatModifier {
  id: string;     // identifier of the modifier
  source: string; // source, used for bulk removal
  type: ModifierType;
  value: number;
}
```

### `IStat`

```typescript
interface IStat {
  id: string;
  name: string;
  baseValue: number;
  modifiers: ReadonlyArray<IStatModifier>;
  readonly value: number; // computed with lazy evaluation
}
```

## Experience

### `CurveType`

```typescript
type CurveType = 'LINEAR' | 'EXPONENTIAL' | 'CUSTOM_TABLE';
```

### `IExperienceConfig`

```typescript
interface IExperienceConfig {
  type: CurveType;
  baseXP: number;
  multiplier: number;
  customTable?: number[]; // used only with CUSTOM_TABLE
}
```

### `ILevelUpResult`

```typescript
interface ILevelUpResult {
  levelsGained: number;
  currentLevel: number;
  excessXP: number;                    // XP remaining after the level ups
  statsUpgraded: Record<string, number>;
}
```

## Skills

### `ISkillNode`

```typescript
interface ISkillNode {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  requiredPlayerLevel: number;
  prerequisiteSkillIds: string[];
  pointCostPerLevel: number;
  passiveModifiers?: IStatModifier[];
  type: 'PASSIVE' | 'ACTIVE';
}
```

### `ISkillUnlockResult`

```typescript
interface ISkillUnlockResult {
  success: boolean;
  reason?: 'LOW_LEVEL' | 'MISSING_PREREQUISITES' | 'NO_POINTS' | 'MAX_LEVEL' | 'NOT_FOUND';
}
```

## Events

### `EngineEvents`

```typescript
type EngineEvents = {
  STAT_CHANGED: { statId: string; newValue: number; baseValue: number };
  LEVEL_UP:     { currentLevel: number; levelsGained: number; excessXP: number };
  XP_GAINED:    { currentXP: number; nextRequiredXP: number; percentage: number };
};
```

### `EventCallback`

```typescript
type EventCallback<T> = (data: T) => void;
```

## Persistence

### `IEngineSaveState`

```typescript
interface IEngineSaveState {
  version: string;
  timestamp: number;
  experience: {
    currentLevel: number;
    currentXP: number;
  };
  stats: {
    baseValues: Record<string, number>;
  };
  skills: {
    unspentPoints: number;
    unlockedSkills: Record<string, number>;
  };
}
```
