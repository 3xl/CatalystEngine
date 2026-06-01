# Statistiche e modificatori

Una **statistica** (`Stat`) è un valore numerico con un valore base e una lista di **modificatori**. Lo [`StatManager`](/api/stat-manager) ne possiede una mappa e ne calcola i valori finali.

## Anatomia di una statistica

```typescript
interface IStat {
  id: string;
  name: string;
  baseValue: number;
  modifiers: ReadonlyArray<IStatModifier>;
  readonly value: number; // calcolato, non assegnabile
}
```

Il `value` è una **proprietà calcolata**: non lo imposti mai direttamente, è il risultato dell'applicazione dei modificatori al `baseValue`.

## Lazy evaluation con dirty flag

Questa è una delle decisioni architetturali chiave. Ogni `Stat` mantiene un flag `_isDirty`:

- quando aggiungi o rimuovi un modificatore, il flag diventa `true`;
- il ricalcolo avviene **solo** quando leggi `.value`, e **solo** se il flag è `true`;
- dopo il ricalcolo il risultato viene messo in cache e il flag torna `false`.

```typescript
const atk = engine.stats.getStat('attack');
atk.addModifier({ id: 'm1', source: 'buff', type: ModifierType.FLAT, value: 5 });
// nessun calcolo è ancora avvenuto

const v = atk.value; // ← QUI avviene il ricalcolo, poi viene messo in cache
const v2 = atk.value; // ← legge dalla cache, nessun ricalcolo
```

Questo evita ricalcoli inutili quando si applicano molti modificatori in sequenza.

## I due tipi di modificatore

```typescript
enum ModifierType {
  FLAT = 'FLAT',       // somma un valore assoluto
  PERCENT = 'PERCENT', // somma una percentuale (additiva fra loro)
}
```

### Ordine di applicazione

Il calcolo applica **prima tutti i `FLAT`, poi i `PERCENT`** in modo additivo:

```
finale = (base + Σ FLAT) × (1 + Σ PERCENT)
```

Il risultato viene **arrotondato** (`Math.round`).

#### Esempio

Base `attack = 10`, con:
- `FLAT +15` (spada)
- `PERCENT +0.20` (buff del 20%)
- `PERCENT +0.10` (aura del 10%)

```
finale = (10 + 15) × (1 + 0.20 + 0.10)
       = 25 × 1.30
       = 32.5 → 33  (arrotondato)
```

I `PERCENT` si **sommano fra loro** prima di moltiplicare: non è un effetto composto moltiplicativo.

### Provalo

Aggiungi e togli modificatori e osserva il valore ricalcolarsi. Nota che la rimozione "Togli spada" avviene **per `source`** e cancella tutti i modificatori di quell'origine in un colpo solo. Il flash `STAT_CHANGED ✦` segnala quando l'engine emette l'evento (sugli `addModifier` dal facade).

<Demo name="stats-playground" title="Stats Playground — modificatori FLAT e PERCENT" :height="340" />

## Gestione per sorgente

I modificatori non si rimuovono per ID astratto, ma per **origine** (`source`). Questo è enorme nella pratica: quando il giocatore si toglie la spada, non devi ricordarti gli ID dei singoli buff che dava.

```typescript
// La spada di fuoco aggiunge più effetti...
engine.addModifier('attack', { id: 'a', source: 'spada_di_fuoco', type: ModifierType.FLAT, value: 15 });
engine.addModifier('attack', { id: 'b', source: 'spada_di_fuoco', type: ModifierType.PERCENT, value: 0.1 });

// ...e si rimuovono tutti in un colpo, per sorgente:
engine.stats.removeAllModifiersFromSource('spada_di_fuoco');
```

A livello di singola statistica esiste anche `Stat.removeModifiersBySource(source)` e `Stat.removeModifier(id)` per il caso puntuale.

## Leggere i valori

```typescript
engine.stats.getStatValue('attack'); // number — 0 se la stat non esiste
engine.stats.getStat('attack');      // Stat | undefined — l'oggetto completo
```

Vedi il [riferimento API dello StatManager](/api/stat-manager) per tutti i metodi.
