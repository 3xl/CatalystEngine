# Quick start

Questo esempio mostra l'intero ciclo di vita dell'engine: creazione, ascolto eventi, guadagno XP, applicazione di un modificatore e salvataggio/ripristino.

## Esempio completo

```typescript
import { CatalystEngine, ModifierType } from 'catalyst-engine';

// 1. Crea l'engine con le statistiche base e la curva di esperienza
const engine = new CatalystEngine(
  { hp: 100, attack: 10, defense: 5 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

// 2. Ascolta gli eventi: la UI reagisce, non interroga
engine.events.on('LEVEL_UP', ({ currentLevel }) => {
  console.log(`Salito al livello ${currentLevel}!`);
});

engine.events.on('STAT_CHANGED', ({ statId, newValue }) => {
  console.log(`${statId} ora vale ${newValue}`);
});

// 3. Guadagna esperienza (può causare uno o più level up)
engine.exp.gainExperience(250);

// 4. Applica un modificatore a una statistica, taggato per sorgente
engine.addModifier('attack', {
  id: 'fire_sword_dmg',
  source: 'spada_di_fuoco',
  type: ModifierType.FLAT,
  value: 15,
});

console.log(engine.stats.getStatValue('attack')); // 25

// 5. Salva e ripristina
const save = engine.save(); // stato minimo serializzabile (JSON puro)
engine.load(save);          // ripristino completo
```

## Cosa è successo, passo per passo

### 1. Costruzione

Il costruttore di [`CatalystEngine`](/api/catalyst-engine) riceve due argomenti:

- una mappa `statId → valore base` (`Record<string, number>`);
- una configurazione di esperienza ([`IExperienceConfig`](/api/interfacce#iexperienceconfig)).

Internamente istanzia i quattro sottosistemi e collega i loro callback interni.

### 2. Ascolto eventi

`engine.events` è l'[`EngineEventBus`](/api/event-bus). Gli eventi sono **completamente tipizzati**: il payload di `LEVEL_UP` è diverso da quello di `STAT_CHANGED`, e TypeScript lo sa.

### 3. Guadagno XP

`engine.exp.gainExperience()` accumula XP e gestisce **level up a catena**: se l'XP basta per salire più livelli in un colpo, lo fa, riportando l'eccedenza. Ogni level up assegna automaticamente **2 punti skill**.

### 4. Modificatori per sorgente

`engine.addModifier()` aggiunge un modificatore e **emette subito** `STAT_CHANGED`. Il campo `source` (`spada_di_fuoco`) ti permette poi di rimuovere tutti i suoi effetti con una sola chiamata, senza tracciare i singoli ID.

### 5. Persistenza

`save()` produce un [`IEngineSaveState`](/api/interfacce#ienginesavestate): solo XP, livello, valori base e skill sbloccate. Niente stato derivato. `load()` lo riapplica e ri-emette gli eventi necessari per risincronizzare la UI.

## Prossimi passi

- [Architettura](/guide/architettura) — la mappa mentale dei moduli.
- [Statistiche e modificatori](/guide/statistiche) — come funziona la matematica.
- [Albero delle skill](/guide/skill) — definire skill via JSON.
