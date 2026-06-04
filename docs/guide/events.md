# Event Bus

The [`EngineEventBus`](/api/event-bus) is the **only** channel of communication between the engine and the outside world. It is a **strongly typed** pub/sub bus: every event has a precise payload that TypeScript knows and verifies.

## The philosophy: total decoupling

Game logic never calls the UI directly. It computes, changes state and **emits events**. The UI (Phaser, React, a headless server…) simply **listens**. This means you can completely change the frontend without touching the engine, and vice versa.

```
  Engine  ──emit──▶  EngineEventBus  ──▶  UI listener
 (produces)                            (consumes)
```

## The three events

The payloads are defined by the `EngineEvents` type:

```typescript
type EngineEvents = {
  STAT_CHANGED: { statId: string; newValue: number; baseValue: number };
  LEVEL_UP:     { currentLevel: number; levelsGained: number; excessXP: number };
  XP_GAINED:    { currentXP: number; nextRequiredXP: number; percentage: number };
};
```

| Event | When it is emitted | Typical use |
| --- | --- | --- |
| `STAT_CHANGED` | on every added modifier or skill upgrade | updating numbers on screen |
| `LEVEL_UP` | when the player gains one or more levels | animations, popups, sounds |
| `XP_GAINED` | on every XP gain | updating the experience bar |

## Subscribing

```typescript
const onLevel = ({ currentLevel }: { currentLevel: number }) => {
  showLevelUpBanner(currentLevel);
};

engine.events.on('LEVEL_UP', onLevel);
```

The type of the `data` parameter is **inferred automatically** from the event: writing `engine.events.on('LEVEL_UP', cb)` gives `cb` exactly `{ currentLevel, levelsGained, excessXP }`. A wrong payload is a compile-time error.

## Unsubscribing

Pass **the same function reference** used in `on`:

```typescript
engine.events.off('LEVEL_UP', onLevel);
```

::: tip
Keep the reference of the callback (like `onLevel` above). An inline anonymous function cannot be removed, because `off` compares by identity.
:::

## Emitting (advanced use)

Normally it is the engine that emits. But the bus is generic and you can use it directly if you extend the engine:

```typescript
engine.events.emit('STAT_CHANGED', {
  statId: 'mana',
  newValue: 50,
  baseValue: 40,
});
```

See the [full API reference](/api/event-bus).

## Try it

Two widgets — an HUD and a log — subscribe **independently** to the same bus: neither one knows the other exists. Press the buttons and watch both react. Then **mute Widget 2** (`off()`): its log stops, but the HUD keeps reacting — proof that the listeners are entirely decoupled.

<Demo name="event-bus" title="Event Bus — independent listeners and off()" :height="348" />
