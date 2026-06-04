# CatalystEngine

The public **facade** of the engine. It coordinates the four subsystems and wires up their internal bindings.

```typescript
import { CatalystEngine } from 'catalyst-engine';
```

## Constructor

```typescript
new CatalystEngine(
  statsConfig: Record<string, number>,
  expConfig: IExperienceConfig
)
```

| Parameter | Type | Description |
| --- | --- | --- |
| `statsConfig` | `Record<string, number>` | Map of `statId → base value`. Initializes the `StatManager`. |
| `expConfig` | [`IExperienceConfig`](/api/interfaces#iexperienceconfig) | Experience curve configuration. |

The constructor instantiates `events`, `stats`, `exp`, `skills` and wires the `ExperienceManager` callbacks to the Event Bus (see [Architecture](/guide/architecture)).

```typescript
const engine = new CatalystEngine(
  { hp: 100, attack: 10, defense: 5 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);
```

## Public properties

| Property | Type | Description |
| --- | --- | --- |
| `stats` | [`StatManager`](/api/stat-manager) | Management of stats and modifiers. |
| `exp` | [`ExperienceManager`](/api/experience-manager) | Management of XP and levels. |
| `events` | [`EngineEventBus`](/api/event-bus) | Typed event bus. |
| `skills` | [`SkillManager`](/api/skill-manager) | Skill tree. |

They are `public`: you can access the subsystems directly (e.g. `engine.exp.gainExperience(...)`).

## Methods

### `addModifier()`

```typescript
addModifier(statId: string, modifier: IStatModifier): void
```

Adds a modifier to the given stat and **emits `STAT_CHANGED`** if the stat exists. It is a shortcut that combines `stats.addModifier()` with emitting the event.

```typescript
engine.addModifier('attack', {
  id: 'fire_sword_dmg',
  source: 'fire_sword',
  type: ModifierType.FLAT,
  value: 15,
});
```

### `save()`

```typescript
save(): IEngineSaveState
```

Exports a **minimal snapshot** of the state (version, timestamp, level+XP, base stat values, unlocked skills). See [Persistence](/guide/persistence).

```typescript
const snapshot = engine.save();
localStorage.setItem('partita', JSON.stringify(snapshot));
```

### `load()`

```typescript
load(saveState: IEngineSaveState): void
```

Restores the state from a snapshot: it resets level/XP, reapplies the base values, rebuilds the skills (re-injecting the passive modifiers) and **re-emits `LEVEL_UP`** to resync the UI.

```typescript
engine.load(JSON.parse(localStorage.getItem('partita')!));
```

::: tip
Create the engine with the same initial configuration (and load the skill tree, if used) **before** calling `load()`. See the note in [Persistence](/guide/persistence).
:::
