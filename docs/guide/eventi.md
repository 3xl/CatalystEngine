# Event Bus

L'[`EngineEventBus`](/api/event-bus) è il **solo** canale di comunicazione tra l'engine e il mondo esterno. È un bus pub/sub **fortemente tipizzato**: ogni evento ha un payload preciso che TypeScript conosce e verifica.

## La filosofia: disaccoppiamento totale

La logica di gioco non chiama mai direttamente la UI. Calcola, cambia stato ed **emette eventi**. La UI (Phaser, React, un server headless…) si limita ad **ascoltare**. Questo significa che puoi cambiare completamente il frontend senza toccare l'engine, e viceversa.

```
  Engine  ──emit──▶  EngineEventBus  ──▶  listener UI
 (produce)                              (consuma)
```

## I tre eventi

I payload sono definiti dal tipo `EngineEvents`:

```typescript
type EngineEvents = {
  STAT_CHANGED: { statId: string; newValue: number; baseValue: number };
  LEVEL_UP:     { currentLevel: number; levelsGained: number; excessXP: number };
  XP_GAINED:    { currentXP: number; nextRequiredXP: number; percentage: number };
};
```

| Evento | Quando viene emesso | Uso tipico |
| --- | --- | --- |
| `STAT_CHANGED` | a ogni modificatore aggiunto o upgrade skill | aggiornare numeri a schermo |
| `LEVEL_UP` | quando il giocatore sale di uno o più livelli | animazioni, popup, suoni |
| `XP_GAINED` | a ogni guadagno di XP | aggiornare la barra dell'esperienza |

## Sottoscriversi

```typescript
const onLevel = ({ currentLevel }: { currentLevel: number }) => {
  showLevelUpBanner(currentLevel);
};

engine.events.on('LEVEL_UP', onLevel);
```

Il tipo del parametro `data` è **inferito automaticamente** dall'evento: scrivere `engine.events.on('LEVEL_UP', cb)` dà a `cb` esattamente `{ currentLevel, levelsGained, excessXP }`. Un payload sbagliato è un errore di compilazione.

## Annullare la sottoscrizione

Passa **lo stesso riferimento** di funzione usato in `on`:

```typescript
engine.events.off('LEVEL_UP', onLevel);
```

::: tip
Conserva il riferimento della callback (come `onLevel` qui sopra). Una funzione anonima inline non può essere rimossa, perché `off` confronta per identità.
:::

## Emettere (uso avanzato)

Normalmente è l'engine a emettere. Ma il bus è generico e puoi usarlo direttamente se estendi l'engine:

```typescript
engine.events.emit('STAT_CHANGED', {
  statId: 'mana',
  newValue: 50,
  baseValue: 40,
});
```

Vedi il [riferimento API completo](/api/event-bus).

## Provalo

Due widget — un HUD e un log — si sottoscrivono **indipendentemente** allo stesso bus: nessuno dei due sa che l'altro esiste. Premi i pulsanti e guarda entrambi reagire. Poi **silenzia il Widget 2** (`off()`): il suo log si ferma, ma l'HUD continua a reagire — la prova che i listener sono del tutto disaccoppiati.

<Demo name="event-bus" title="Event Bus — listener indipendenti e off()" :height="348" />
