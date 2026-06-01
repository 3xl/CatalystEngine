# Interfacce e tipi

Tutti i tipi pubblici esportati da `catalyst-engine`. Sono raggruppati per dominio.

## Statistiche

### `ModifierType`

```typescript
enum ModifierType {
  FLAT = 'FLAT',       // somma un valore assoluto
  PERCENT = 'PERCENT', // somma una percentuale (additiva fra modificatori)
}
```

### `IStatModifier`

```typescript
interface IStatModifier {
  id: string;     // identificatore del modificatore
  source: string; // origine, usata per la rimozione in blocco
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
  readonly value: number; // calcolato con lazy evaluation
}
```

## Esperienza

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
  customTable?: number[]; // usato solo con CUSTOM_TABLE
}
```

### `ILevelUpResult`

```typescript
interface ILevelUpResult {
  levelsGained: number;
  currentLevel: number;
  excessXP: number;                    // XP residuo dopo i level up
  statsUpgraded: Record<string, number>;
}
```

## Skill

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

## Eventi

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

## Persistenza

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
