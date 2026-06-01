# Introduzione

**CatalystEngine** è un motore di progressione e gestione delle statistiche **data-driven**, **polimorfo** e **plug-and-play** per TypeScript e PhaserJS.

L'engine è agnostico rispetto alla grafica e al genere: può gestire l'evoluzione di un eroe fantasy, il potenziamento dei motori di un'astronave, o i parametri di sviluppo di una fazione strategica. Il suo unico compito è **calcolare la matematica di gioco** e **notificare il mondo esterno** tramite un Event Bus tipizzato.

## A cosa serve

Tutti i giochi con progressione condividono gli stessi problemi: statistiche che cambiano in base a buff/equipaggiamento, curve di esperienza, alberi di abilità con prerequisiti, e salvataggi. CatalystEngine risolve questi problemi una volta sola, in modo riusabile e completamente disaccoppiato dal layer grafico.

```typescript
import { CatalystEngine, ModifierType } from 'catalyst-engine';

const engine = new CatalystEngine(
  { hp: 100, attack: 10, defense: 5 },
  { type: 'EXPONENTIAL', baseXP: 100, multiplier: 1.5 }
);

engine.events.on('LEVEL_UP', ({ currentLevel }) => {
  console.log(`Salito al livello ${currentLevel}!`);
});

engine.exp.gainExperience(250);
```

## Le cinque decisioni architetturali

CatalystEngine è costruito attorno a cinque principi precisi. Ognuno ha una pagina dedicata nella guida.

| Principio | In breve |
| --- | --- |
| **Disaccoppiamento totale (event-driven)** | La logica comunica solo tramite l'[`EngineEventBus`](/guide/eventi). La UI ascolta, non interroga. |
| **Lazy evaluation con dirty flag** | Le [statistiche](/guide/statistiche) si ricalcolano solo quando serve, alla richiesta del valore. |
| **Gestione per sorgente** | I modificatori si rimuovono per origine (es. `spada_di_fuoco`), non per ID. |
| **Albero delle skill a grafo (DAG)** | Ogni [nodo skill](/guide/skill) dichiara prerequisiti, definibili via JSON. |
| **Snapshot pattern per la persistenza** | [`save()`](/guide/persistenza) esporta uno stato minimo in JSON puro. |

## I moduli

CatalystEngine è un **facade** che coordina quattro sottosistemi indipendenti:

| Modulo | Responsabilità |
| --- | --- |
| [`StatManager`](/api/stat-manager) | Statistiche atomiche e applicazione algebrica dei modificatori (`FLAT` / `PERCENT`). |
| [`ExperienceManager`](/api/experience-manager) | Accumulo XP, soglie di livello (lineari/esponenziali/tabella) e ridistribuzione dell'eccedenza. |
| [`SkillManager`](/api/skill-manager) | Albero delle abilità, punti da spendere e iniezione dei modificatori passivi. |
| [`EngineEventBus`](/api/event-bus) | Bus di eventi tipizzato (`STAT_CHANGED`, `LEVEL_UP`, `XP_GAINED`). |
| [`CatalystEngine`](/api/catalyst-engine) | Il facade che li lega insieme. |

## Prossimi passi

- [Installazione](/guide/installazione) — aggiungi l'engine al tuo progetto.
- [Quick start](/guide/quick-start) — un esempio completo end-to-end.
- [Architettura](/guide/architettura) — come i pezzi si incastrano.
