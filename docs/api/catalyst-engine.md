# CatalystEngine

Il **facade** pubblico dell'engine. Coordina i quattro sottosistemi e ne collega i binding interni.

```typescript
import { CatalystEngine } from 'catalyst-engine';
```

## Costruttore

```typescript
new CatalystEngine(
  statsConfig: Record<string, number>,
  expConfig: IExperienceConfig
)
```

| Parametro | Tipo | Descrizione |
| --- | --- | --- |
| `statsConfig` | `Record<string, number>` | Mappa `statId → valore base`. Inizializza lo `StatManager`. |
| `expConfig` | [`IExperienceConfig`](/api/interfacce#iexperienceconfig) | Configurazione della curva di esperienza. |

Il costruttore istanzia `events`, `stats`, `exp`, `skills` e collega i callback dell'`ExperienceManager` all'Event Bus (vedi [Architettura](/guide/architettura)).

```typescript
const engine = new CatalystEngine(
  { hp: 100, attack: 10, defense: 5 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);
```

## Proprietà pubbliche

| Proprietà | Tipo | Descrizione |
| --- | --- | --- |
| `stats` | [`StatManager`](/api/stat-manager) | Gestione delle statistiche e dei modificatori. |
| `exp` | [`ExperienceManager`](/api/experience-manager) | Gestione di XP e livelli. |
| `events` | [`EngineEventBus`](/api/event-bus) | Bus di eventi tipizzato. |
| `skills` | [`SkillManager`](/api/skill-manager) | Albero delle abilità. |

Sono `public`: puoi accedere ai sottosistemi direttamente (es. `engine.exp.gainExperience(...)`).

## Metodi

### `addModifier()`

```typescript
addModifier(statId: string, modifier: IStatModifier): void
```

Aggiunge un modificatore alla statistica indicata ed **emette `STAT_CHANGED`** se la statistica esiste. È una scorciatoia che combina `stats.addModifier()` con l'emissione dell'evento.

```typescript
engine.addModifier('attack', {
  id: 'fire_sword_dmg',
  source: 'spada_di_fuoco',
  type: ModifierType.FLAT,
  value: 15,
});
```

### `save()`

```typescript
save(): IEngineSaveState
```

Esporta uno **snapshot minimo** dello stato (versione, timestamp, livello+XP, valori base delle statistiche, skill sbloccate). Vedi [Persistenza](/guide/persistenza).

```typescript
const snapshot = engine.save();
localStorage.setItem('partita', JSON.stringify(snapshot));
```

### `load()`

```typescript
load(saveState: IEngineSaveState): void
```

Ripristina lo stato da uno snapshot: reimposta livello/XP, riapplica i valori base, ricostruisce le skill (ri-iniettando i modificatori passivi) e **ri-emette `LEVEL_UP`** per risincronizzare la UI.

```typescript
engine.load(JSON.parse(localStorage.getItem('partita')!));
```

::: tip
Crea l'engine con la stessa configurazione di partenza (e carica l'albero skill, se usato) **prima** di chiamare `load()`. Vedi la nota in [Persistenza](/guide/persistenza).
:::
