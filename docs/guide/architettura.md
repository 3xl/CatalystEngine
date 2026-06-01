# Architettura

CatalystEngine segue il **pattern Facade**: la classe [`CatalystEngine`](/api/catalyst-engine) è l'unico punto di ingresso che coordina quattro sottosistemi indipendenti, ciascuno con una singola responsabilità.

## La mappa

```
                    ┌─────────────────────────┐
                    │     CatalystEngine      │  ◀── facade pubblico
                    │  (coordina i moduli)    │
                    └───────────┬─────────────┘
          ┌─────────────┬───────┼────────────┬─────────────┐
          ▼             ▼       ▼            ▼             ▼
   ┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────────┐
   │ StatManager│ │SkillMgr  │ │ExperienceMgr │ │ EngineEventBus │
   └─────┬──────┘ └────┬─────┘ └──────┬───────┘ └───────▲────────┘
         │             │              │                 │
      Stat[]      skill tree      curva XP          eventi tipizzati
         │             │              │                 │
         └─────────────┴──────────────┴─────────────────┘
                    tutto notifica il mondo esterno
                       SOLO tramite l'Event Bus
```

## I quattro sottosistemi

### StatManager
Possiede una mappa di oggetti [`Stat`](/api/interfacce#istat) atomici. Ogni `Stat` calcola il proprio valore finale applicando i modificatori (`FLAT` poi `PERCENT`) con **lazy evaluation**. Vedi [Statistiche e modificatori](/guide/statistiche).

### ExperienceManager
Conosce solo XP e livelli. Espone i callback `onLevelUp` e `onXPGained` che il facade collega all'Event Bus. Supporta curve `LINEAR`, `EXPONENTIAL` e `CUSTOM_TABLE`. Vedi [Esperienza e livelli](/guide/esperienza).

### SkillManager
Gestisce l'albero delle abilità come grafo (DAG). Riceve **per dependency injection** sia lo `StatManager` (per iniettare i modificatori passivi) sia l'`EngineEventBus`. Vedi [Albero delle skill](/guide/skill).

### EngineEventBus
Bus pub/sub **fortemente tipizzato**. È il solo canale di comunicazione verso l'esterno. Vedi [Event Bus](/guide/eventi).

## Il flusso che lega tutto: il level up

Il binding interno più interessante avviene nel costruttore del facade (`setupInternalBindings`). Mostra come i moduli, pur disaccoppiati, collaborano:

```
exp.gainExperience(250)
        │
        ▼
ExperienceManager rileva il level up
        │
        ├──▶ onLevelUp  ──▶  skills.addSkillPoints(levelsGained * 2)
        │                    events.emit('LEVEL_UP', {...})
        │
        └──▶ onXPGained ──▶  events.emit('XP_GAINED', {...})
```

Nota il dettaglio di design: l'`ExperienceManager` **non conosce** né lo `SkillManager` né l'Event Bus. Espone solo callback. È il facade a decidere che "salire di livello dà 2 punti skill". Questo mantiene i moduli sostituibili e testabili in isolamento.

## Perché questo disegno

- **Testabilità:** ogni modulo si testa da solo (la suite ha copertura al 100%).
- **Sostituibilità:** puoi cambiare la curva XP o l'albero skill senza toccare il resto.
- **UI agnostica:** Phaser, React o un server headless ascoltano gli stessi eventi.
- **Nessuno stato derivato persistito:** solo i dati grezzi vengono salvati, il resto si ricalcola.
