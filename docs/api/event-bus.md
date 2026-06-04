# EngineEventBus

**Strongly typed** pub/sub bus: the sole communication channel between the engine and the outside world. Accessible via `engine.events`.

```typescript
import { EngineEventBus } from 'catalyst-engine';
```

Conceptual guide: [Event Bus](/guide/events).

## Events and payloads

The `EngineEvents` type defines the three events and their payloads:

```typescript
type EngineEvents = {
  STAT_CHANGED: { statId: string; newValue: number; baseValue: number };
  LEVEL_UP:     { currentLevel: number; levelsGained: number; excessXP: number };
  XP_GAINED:    { currentXP: number; nextRequiredXP: number; percentage: number };
};
```

The methods are **generic** over `K extends keyof EngineEvents`: the payload type is inferred from the event name, so a callback with the wrong signature is a compile-time error.

## Methods

### `on()`

```typescript
on<K extends keyof EngineEvents>(
  event: K,
  callback: EventCallback<EngineEvents[K]>
): void
```

Registers a callback for the event. Multiple callbacks on the same event are invoked in registration order.

```typescript
engine.events.on('XP_GAINED', ({ percentage }) => updateBar(percentage));
```

### `off()`

```typescript
off<K extends keyof EngineEvents>(
  event: K,
  callback: EventCallback<EngineEvents[K]>
): void
```

Removes a registered callback. The comparison is **by reference identity**: pass the same function used in `on()`.

```typescript
const cb = ({ currentLevel }) => {};
engine.events.on('LEVEL_UP', cb);
engine.events.off('LEVEL_UP', cb); // ✅ removed
```

::: warning
An inline anonymous callback can never be removed, because each use is a different reference.
:::

### `emit()`

```typescript
emit<K extends keyof EngineEvents>(
  event: K,
  data: EngineEvents[K]
): void
```

Invokes all callbacks registered for the event, passing the payload. Normally it is the engine that calls it; use it directly only if you extend the engine.

```typescript
engine.events.emit('STAT_CHANGED', { statId: 'mana', newValue: 50, baseValue: 40 });
```

## Helper type

```typescript
type EventCallback<T> = (data: T) => void;
```
