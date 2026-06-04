# StatManager

Owns and manages the collection of stats (`Stat`) and the application of modifiers. Accessible via `engine.stats`.

```typescript
import { StatManager } from 'catalyst-engine';
```

Conceptual guide: [Stats and modifiers](/guide/stats).

## Methods

### `initialize()`

```typescript
initialize(config: Record<string, number>): void
```

Creates a stat for each `statId → base value` pair. The internal name of the stat is the id in uppercase. Called automatically by the [`CatalystEngine`](/api/catalyst-engine) constructor.

```typescript
engine.stats.initialize({ hp: 100, attack: 10 });
```

### `getStat()`

```typescript
getStat(statId: string): Stat | undefined
```

Returns the full `Stat` object, or `undefined` if it does not exist.

### `getStatValue()`

```typescript
getStatValue(statId: string): number
```

Returns the computed **final value** (with modifiers applied). Returns `0` if the stat does not exist.

```typescript
engine.stats.getStatValue('attack'); // e.g. 25
```

### `addModifier()`

```typescript
addModifier(statId: string, modifier: IStatModifier): void
```

Adds a modifier to the given stat. If the stat does not exist, the operation is a silent no-op.

::: tip
At the facade level, [`CatalystEngine.addModifier()`](/api/catalyst-engine#addmodifier) does the same **and emits** `STAT_CHANGED`. Prefer it for normal use.
:::

### `removeAllModifiersFromSource()`

```typescript
removeAllModifiersFromSource(source: string): void
```

Removes from **all** stats the modifiers with the given `source`. It is the core of [management by source](/guide/stats#source-based-management).

```typescript
engine.stats.removeAllModifiersFromSource('fire_sword');
```

### `exportState()`

```typescript
exportState(): Record<string, number>
```

Exports **only the base values** (`statId → baseValue`). Used internally by [`save()`](/api/catalyst-engine#save).

### `importState()`

```typescript
importState(baseValues: Record<string, number>): void
```

Resets the base values on the existing stats and marks them as "dirty" so they will be recomputed. Used internally by [`load()`](/api/catalyst-engine#load).

## The `Stat` class

Each stat is a `Stat` object that implements [`IStat`](/api/interfaces#istat). Relevant methods:

| Method / Property | Description |
| --- | --- |
| `value` (getter) | Final value computed with [lazy evaluation](/guide/stats#lazy-evaluation-with-dirty-flag). |
| `baseValue` | Base value (read/write). |
| `modifiers` (getter) | Read-only list of the active modifiers. |
| `addModifier(mod)` | Adds a modifier and marks dirty. |
| `removeModifier(id)` | Removes a modifier by ID. |
| `removeModifiersBySource(source)` | Removes all modifiers from a source. |
