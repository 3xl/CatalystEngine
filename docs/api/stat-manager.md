# StatManager

Possiede e gestisce la collezione di statistiche (`Stat`) e l'applicazione dei modificatori. Accessibile via `engine.stats`.

```typescript
import { StatManager } from 'catalyst-engine';
```

Guida concettuale: [Statistiche e modificatori](/guide/statistiche).

## Metodi

### `initialize()`

```typescript
initialize(config: Record<string, number>): void
```

Crea una statistica per ogni coppia `statId → valore base`. Il nome interno della statistica è l'id in maiuscolo. Chiamato automaticamente dal costruttore del [`CatalystEngine`](/api/catalyst-engine).

```typescript
engine.stats.initialize({ hp: 100, attack: 10 });
```

### `getStat()`

```typescript
getStat(statId: string): Stat | undefined
```

Ritorna l'oggetto `Stat` completo, o `undefined` se non esiste.

### `getStatValue()`

```typescript
getStatValue(statId: string): number
```

Ritorna il **valore finale** calcolato (modificatori applicati). Ritorna `0` se la statistica non esiste.

```typescript
engine.stats.getStatValue('attack'); // es. 25
```

### `addModifier()`

```typescript
addModifier(statId: string, modifier: IStatModifier): void
```

Aggiunge un modificatore alla statistica indicata. Se la statistica non esiste, l'operazione è un no-op silenzioso.

::: tip
A livello di facade, [`CatalystEngine.addModifier()`](/api/catalyst-engine#addmodifier) fa lo stesso **ed emette** `STAT_CHANGED`. Preferiscilo nell'uso normale.
:::

### `removeAllModifiersFromSource()`

```typescript
removeAllModifiersFromSource(source: string): void
```

Rimuove da **tutte** le statistiche i modificatori con la `source` indicata. È il cuore della [gestione per sorgente](/guide/statistiche#gestione-per-sorgente).

```typescript
engine.stats.removeAllModifiersFromSource('spada_di_fuoco');
```

### `exportState()`

```typescript
exportState(): Record<string, number>
```

Esporta i **soli valori base** (`statId → baseValue`). Usato internamente da [`save()`](/api/catalyst-engine#save).

### `importState()`

```typescript
importState(baseValues: Record<string, number>): void
```

Reimposta i valori base sulle statistiche esistenti e le marca come "dirty" così verranno ricalcolate. Usato internamente da [`load()`](/api/catalyst-engine#load).

## La classe `Stat`

Ogni statistica è un oggetto `Stat` che implementa [`IStat`](/api/interfacce#istat). Metodi rilevanti:

| Metodo / Proprietà | Descrizione |
| --- | --- |
| `value` (getter) | Valore finale calcolato con [lazy evaluation](/guide/statistiche#lazy-evaluation-con-dirty-flag). |
| `baseValue` | Valore base (lettura/scrittura). |
| `modifiers` (getter) | Lista in sola lettura dei modificatori attivi. |
| `addModifier(mod)` | Aggiunge un modificatore e marca dirty. |
| `removeModifier(id)` | Rimuove un modificatore per ID. |
| `removeModifiersBySource(source)` | Rimuove tutti i modificatori di una sorgente. |
