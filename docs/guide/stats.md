# Stats and modifiers

A **stat** (`Stat`) is a numeric value with a base value and a list of **modifiers**. The [`StatManager`](/api/stat-manager) owns a map of them and computes their final values.

## Anatomy of a stat

```typescript
interface IStat {
  id: string;
  name: string;
  baseValue: number;
  modifiers: ReadonlyArray<IStatModifier>;
  readonly value: number; // computed, not assignable
}
```

The `value` is a **computed property**: you never set it directly, it is the result of applying the modifiers to the `baseValue`.

## Lazy evaluation with dirty flag

This is one of the key architectural decisions. Each `Stat` keeps an `_isDirty` flag:

- when you add or remove a modifier, the flag becomes `true`;
- recalculation happens **only** when you read `.value`, and **only** if the flag is `true`;
- after recalculation the result is cached and the flag returns to `false`.

```typescript
const atk = engine.stats.getStat('attack');
atk.addModifier({ id: 'm1', source: 'buff', type: ModifierType.FLAT, value: 5 });
// no calculation has happened yet

const v = atk.value; // ← recalculation happens HERE, then it is cached
const v2 = atk.value; // ← reads from the cache, no recalculation
```

This avoids needless recalculations when many modifiers are applied in sequence.

## The two modifier types

```typescript
enum ModifierType {
  FLAT = 'FLAT',       // adds an absolute value
  PERCENT = 'PERCENT', // adds a percentage (additive among themselves)
}
```

### Application order

The calculation applies **all `FLAT` first, then the `PERCENT`** additively:

```
final = (base + Σ FLAT) × (1 + Σ PERCENT)
```

The result is **rounded** (`Math.round`).

#### Example

Base `attack = 10`, with:
- `FLAT +15` (sword)
- `PERCENT +0.20` (20% buff)
- `PERCENT +0.10` (10% aura)

```
final = (10 + 15) × (1 + 0.20 + 0.10)
      = 25 × 1.30
      = 32.5 → 33  (rounded)
```

The `PERCENT` modifiers **add up among themselves** before multiplying: it is not a compounding multiplicative effect.

### Try it

Add and remove modifiers and watch the value recalculate. Note that the "Remove sword" action happens **by `source`** and clears all modifiers from that source in one go. The `STAT_CHANGED ✦` flash signals when the engine emits the event (on `addModifier` calls from the facade).

<Demo name="stats-playground" title="Stats Playground — FLAT and PERCENT modifiers" :height="340" />

## Source-based management

Modifiers are not removed by an abstract ID, but by **source** (`source`). This is huge in practice: when the player unequips the sword, you don't have to remember the IDs of the individual buffs it provided.

```typescript
// The fire sword adds several effects...
engine.addModifier('attack', { id: 'a', source: 'fire_sword', type: ModifierType.FLAT, value: 15 });
engine.addModifier('attack', { id: 'b', source: 'fire_sword', type: ModifierType.PERCENT, value: 0.1 });

// ...and they are all removed at once, by source:
engine.stats.removeAllModifiersFromSource('fire_sword');
```

At the level of a single stat there is also `Stat.removeModifiersBySource(source)` and `Stat.removeModifier(id)` for the targeted case.

## Reading values

```typescript
engine.stats.getStatValue('attack'); // number — 0 if the stat does not exist
engine.stats.getStat('attack');      // Stat | undefined — the full object
```

See the [StatManager API reference](/api/stat-manager) for all methods.
