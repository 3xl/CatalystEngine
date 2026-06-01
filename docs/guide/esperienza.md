# Esperienza e livelli

L'[`ExperienceManager`](/api/experience-manager) accumula XP, calcola le soglie di livello secondo una curva configurabile e gestisce i **level up a catena**.

## Configurazione della curva

Alla creazione fornisci un [`IExperienceConfig`](/api/interfacce#iexperienceconfig):

```typescript
interface IExperienceConfig {
  type: 'LINEAR' | 'EXPONENTIAL' | 'CUSTOM_TABLE';
  baseXP: number;
  multiplier: number;
  customTable?: number[];
}
```

### Le tre curve

| Tipo | Formula per la soglia del livello `L` (con `L > 1`) |
| --- | --- |
| `LINEAR` | `baseXP × (L - 1)` |
| `EXPONENTIAL` | `round(baseXP × (L - 1) ^ multiplier)` |
| `CUSTOM_TABLE` | `customTable[L]` (se assente → `Infinity`, livello non raggiungibile) |

Il livello 1 richiede sempre `0` XP. Le soglie sono **per-livello** (XP necessario per passare dal livello `L-1` al livello `L`), non cumulative.

```typescript
const engine = new CatalystEngine(
  { hp: 100 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

engine.exp.getXPRequirementForLevel(2); // 100
engine.exp.getXPRequirementForLevel(3); // round(100 × 2^1.5) ≈ 283
```

## Guadagnare esperienza

`gainExperience(amount)` aggiunge XP e fa salire **tutti i livelli possibili** in una sola chiamata, riportando l'eccedenza:

```typescript
const result = engine.exp.gainExperience(250);
// result: ILevelUpResult
// {
//   levelsGained: number,
//   currentLevel: number,
//   excessXP: number,       // XP residuo dopo i level up
//   statsUpgraded: {}
// }
```

L'algoritmo sottrae la soglia ad ogni salita finché l'XP residuo non basta più: un singolo `gainExperience` può quindi produrre **più level up** se il quantitativo è grande.

## I callback

L'`ExperienceManager` è disaccoppiato dal resto: non emette eventi da solo, espone **due callback** che il [facade](/guide/architettura) collega all'Event Bus.

```typescript
exp.onLevelUp = (result: ILevelUpResult) => { /* ... */ };
exp.onXPGained = (currentXP: number, nextLevelXP: number) => { /* ... */ };
```

Nell'uso normale **non li tocchi**: il `CatalystEngine` li imposta nel costruttore così:

- `onLevelUp` → assegna `levelsGained × 2` punti skill ed emette `LEVEL_UP`;
- `onXPGained` → emette `XP_GAINED` con la percentuale di avanzamento verso il livello successivo.

Quindi, dal punto di vista del tuo codice di gioco, ti basta **ascoltare gli eventi**:

```typescript
engine.events.on('LEVEL_UP', ({ currentLevel, levelsGained, excessXP }) => {
  console.log(`Hai guadagnato ${levelsGained} livelli! Ora sei al ${currentLevel}.`);
});

engine.events.on('XP_GAINED', ({ currentXP, nextRequiredXP, percentage }) => {
  updateXpBar(percentage); // 0..1
});
```

## Livello e XP correnti

```typescript
engine.exp.currentLevel; // number (sola lettura)
engine.exp.currentXP;    // number (sola lettura, XP nel livello corrente)
```

## Provalo

La barra XP è guidata **solo** da `XP_GAINED.percentage` e l'animazione di level-up da `LEVEL_UP`: la UI non interroga mai l'engine. Prova **+1000 XP** dal livello 1 per vedere un **level-up a catena** (più livelli in un colpo) — guarda anche i punti skill salire di 2 per livello.

<Demo name="xp-levelup" title="XP & Level Up — UI guidata dagli eventi" :height="320" />
