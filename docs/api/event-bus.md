# EngineEventBus

Bus pub/sub **fortemente tipizzato**: il solo canale di comunicazione tra engine e mondo esterno. Accessibile via `engine.events`.

```typescript
import { EngineEventBus } from 'catalyst-engine';
```

Guida concettuale: [Event Bus](/guide/eventi).

## Eventi e payload

Il tipo `EngineEvents` definisce i tre eventi e i loro payload:

```typescript
type EngineEvents = {
  STAT_CHANGED: { statId: string; newValue: number; baseValue: number };
  LEVEL_UP:     { currentLevel: number; levelsGained: number; excessXP: number };
  XP_GAINED:    { currentXP: number; nextRequiredXP: number; percentage: number };
};
```

I metodi sono **generici** su `K extends keyof EngineEvents`: il tipo del payload è inferito dal nome dell'evento, quindi una callback con la firma sbagliata è un errore di compilazione.

## Metodi

### `on()`

```typescript
on<K extends keyof EngineEvents>(
  event: K,
  callback: EventCallback<EngineEvents[K]>
): void
```

Registra una callback per l'evento. Più callback sullo stesso evento vengono invocate nell'ordine di registrazione.

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

Rimuove una callback registrata. Il confronto è **per identità di riferimento**: passa la stessa funzione usata in `on()`.

```typescript
const cb = ({ currentLevel }) => {};
engine.events.on('LEVEL_UP', cb);
engine.events.off('LEVEL_UP', cb); // ✅ rimossa
```

::: warning
Una callback anonima inline non potrà mai essere rimossa, perché ad ogni uso è un riferimento diverso.
:::

### `emit()`

```typescript
emit<K extends keyof EngineEvents>(
  event: K,
  data: EngineEvents[K]
): void
```

Invoca tutte le callback registrate per l'evento, passando il payload. Normalmente è l'engine a chiamarlo; usalo direttamente solo se estendi l'engine.

```typescript
engine.events.emit('STAT_CHANGED', { statId: 'mana', newValue: 50, baseValue: 40 });
```

## Tipo di supporto

```typescript
type EventCallback<T> = (data: T) => void;
```
