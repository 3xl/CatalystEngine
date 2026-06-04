# Persistence

CatalystEngine uses the **Snapshot pattern**: `save()` exports a **minimal** state as pure JSON, and `load()` restores it. No derived state is saved — anything that can be computed is recomputed.

## What gets saved

`engine.save()` produces an [`IEngineSaveState`](/api/interfaces#ienginesavestate):

```typescript
interface IEngineSaveState {
  version: string;
  timestamp: number;
  experience: {
    currentLevel: number;
    currentXP: number;
  };
  stats: {
    baseValues: Record<string, number>; // only the BASE values
  };
  skills: {
    unspentPoints: number;
    unlockedSkills: Record<string, number>; // id → level
  };
}
```

Note what is **not** there: no final stat value, no active modifier, no XP threshold. These are all **derived** data that the engine reconstructs.

## Why save only the minimum

- **Small files:** ideal for `LocalStorage` or a database column.
- **Robustness against balancing changes:** if you change the XP curve or the values of the skills' passive modifiers, old saves remain valid — the numbers are recomputed with the new rules.
- **No inconsistency:** it is impossible to save a "final" state that does not match the current rules.

## Saving and restoring

```typescript
// Save
const save = engine.save();
localStorage.setItem('partita', JSON.stringify(save));

// Load
const raw = localStorage.getItem('partita');
if (raw) {
  engine.load(JSON.parse(raw) as IEngineSaveState);
}
```

## What `load()` does

The restore:

1. resets the `ExperienceManager`'s current level and XP;
2. reapplies the base values to the `StatManager` (`importState`);
3. reconstructs the unlocked skills and **re-injects the passive modifiers** into the stats;
4. **re-emits** a `LEVEL_UP` event (with `levelsGained: 0`) to give the UI a chance to resync to the current values.

::: warning Important
`load()` reapplies the base values **to the stats already existing** in the engine. Create the engine with the same starting stat configuration before calling `load()`, then restore the snapshot.
:::

```typescript
// 1. create the engine with the initial config
const engine = new CatalystEngine(
  { hp: 100, attack: 10, defense: 5 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

// 2. (if the skill tree uses passive modifiers) load it before load
engine.skills.loadSkillTree(skillTreeJson);

// 3. restore the snapshot
engine.load(save);
```

## Try it

Build up a state (XP and a skill), press **Save** and look at the JSON snapshot: it contains **only** base, level and skills — no final values nor transient modifiers. Then **Reset** clears the live engine, and **Load** restores everything, **re-injecting** the skill's passive modifiers (the ATK goes back to its upgraded value).

<Demo name="save-load" title="Save / Load — minimal snapshot and restore" :height="360" />
