# Quick start

This example shows the entire lifecycle of the engine: creation, event listening, gaining XP, applying a modifier and saving/restoring.

## Complete example

```typescript
import { CatalystEngine, ModifierType } from 'catalyst-engine';

// 1. Create the engine with the base stats and the experience curve
const engine = new CatalystEngine(
  { hp: 100, attack: 10, defense: 5 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

// 2. Listen to events: the UI reacts, it doesn't query
engine.events.on('LEVEL_UP', ({ currentLevel }) => {
  console.log(`Reached level ${currentLevel}!`);
});

engine.events.on('STAT_CHANGED', ({ statId, newValue }) => {
  console.log(`${statId} is now ${newValue}`);
});

// 3. Gain experience (may trigger one or more level ups)
engine.exp.gainExperience(250);

// 4. Apply a modifier to a stat, tagged by source
engine.addModifier('attack', {
  id: 'fire_sword_dmg',
  source: 'fire_sword',
  type: ModifierType.FLAT,
  value: 15,
});

console.log(engine.stats.getStatValue('attack')); // 25

// 5. Save and restore
const save = engine.save(); // minimal serializable state (pure JSON)
engine.load(save);          // full restore
```

## What happened, step by step

### 1. Construction

The [`CatalystEngine`](/api/catalyst-engine) constructor takes two arguments:

- a `statId → base value` map (`Record<string, number>`);
- an experience configuration ([`IExperienceConfig`](/api/interfaces#iexperienceconfig)).

Internally it instantiates the four subsystems and wires up their internal callbacks.

### 2. Event listening

`engine.events` is the [`EngineEventBus`](/api/event-bus). Events are **fully typed**: the payload of `LEVEL_UP` is different from that of `STAT_CHANGED`, and TypeScript knows it.

### 3. Gaining XP

`engine.exp.gainExperience()` accumulates XP and handles **chained level ups**: if the XP is enough to gain several levels at once, it does so, carrying over the overflow. Each level up automatically grants **2 skill points**.

### 4. Source-based modifiers

`engine.addModifier()` adds a modifier and **immediately emits** `STAT_CHANGED`. The `source` field (`fire_sword`) then lets you remove all of its effects with a single call, without tracking individual IDs.

### 5. Persistence

`save()` produces an [`IEngineSaveState`](/api/interfaces#ienginesavestate): only XP, level, base values and unlocked skills. No derived state. `load()` reapplies it and re-emits the events needed to resync the UI.

## Next steps

- [Architecture](/guide/architecture) — the mental map of the modules.
- [Stats and modifiers](/guide/stats) — how the math works.
- [Skill tree](/guide/skill-tree) — defining skills via JSON.
