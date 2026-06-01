# Persistenza

CatalystEngine usa lo **Snapshot pattern**: `save()` esporta uno stato **minimo** in JSON puro, e `load()` lo ripristina. Niente stato derivato viene salvato — tutto ciò che è calcolabile si ricalcola.

## Cosa viene salvato

`engine.save()` produce un [`IEngineSaveState`](/api/interfacce#ienginesavestate):

```typescript
interface IEngineSaveState {
  version: string;
  timestamp: number;
  experience: {
    currentLevel: number;
    currentXP: number;
  };
  stats: {
    baseValues: Record<string, number>; // solo i valori BASE
  };
  skills: {
    unspentPoints: number;
    unlockedSkills: Record<string, number>; // id → livello
  };
}
```

Nota cosa **non** c'è: nessun valore finale di statistica, nessun modificatore attivo, nessuna soglia XP. Sono tutti dati **derivati** che l'engine ricostruisce.

## Perché salvare solo il minimo

- **File piccoli:** ideale per `LocalStorage` o una colonna di database.
- **Robustezza alle modifiche di bilanciamento:** se cambi la curva XP o i valori dei modificatori passivi delle skill, i salvataggi vecchi restano validi — i numeri si ricalcolano con le nuove regole.
- **Nessuna incoerenza:** è impossibile salvare uno stato "finale" che non corrisponde alle regole correnti.

## Salvare e ripristinare

```typescript
// Salvataggio
const save = engine.save();
localStorage.setItem('partita', JSON.stringify(save));

// Caricamento
const raw = localStorage.getItem('partita');
if (raw) {
  engine.load(JSON.parse(raw) as IEngineSaveState);
}
```

## Cosa fa `load()`

Il ripristino:

1. reimposta livello e XP correnti dell'`ExperienceManager`;
2. riapplica i valori base allo `StatManager` (`importState`);
3. ricostruisce le skill sbloccate e **ri-inietta i modificatori passivi** nelle statistiche;
4. **ri-emette** un evento `LEVEL_UP` (con `levelsGained: 0`) per dare alla UI l'occasione di risincronizzarsi sui valori correnti.

::: warning Importante
`load()` riapplica i valori base **sulle statistiche già esistenti** nell'engine. Crea l'engine con la stessa configurazione di statistiche di partenza prima di chiamare `load()`, poi ripristina lo snapshot.
:::

```typescript
// 1. crea l'engine con la config iniziale
const engine = new CatalystEngine(
  { hp: 100, attack: 10, defense: 5 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

// 2. (se l'albero skill usa modificatori passivi) caricalo prima del load
engine.skills.loadSkillTree(skillTreeJson);

// 3. ripristina lo snapshot
engine.load(save);
```

## Provalo

Costruisci uno stato (XP e una skill), premi **Save** e guarda lo snapshot JSON: contiene **solo** base, livello e skill — niente valori finali né modificatori transitori. Poi **Reset** azzera l'engine vivo, e **Load** ripristina tutto, **ri-iniettando** i modificatori passivi della skill (l'ATK torna potenziato).

<Demo name="save-load" title="Save / Load — snapshot minimo e ripristino" :height="360" />
