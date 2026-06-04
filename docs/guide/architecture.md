# Architecture

CatalystEngine follows the **Facade pattern**: the [`CatalystEngine`](/api/catalyst-engine) class is the single entry point that coordinates four independent subsystems, each with a single responsibility.

## The map

```
                    ┌─────────────────────────┐
                    │     CatalystEngine      │  ◀── public facade
                    │   (coordinates modules) │
                    └───────────┬─────────────┘
          ┌─────────────┬───────┼────────────┬─────────────┐
          ▼             ▼       ▼            ▼             ▼
   ┌────────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────────┐
   │ StatManager│ │SkillMgr  │ │ExperienceMgr │ │ EngineEventBus │
   └─────┬──────┘ └────┬─────┘ └──────┬───────┘ └───────▲────────┘
         │             │              │                 │
      Stat[]      skill tree      XP curve         typed events
         │             │              │                 │
         └─────────────┴──────────────┴─────────────────┘
                  everything notifies the outside world
                          ONLY through the Event Bus
```

## The four subsystems

### StatManager
Owns a map of atomic [`Stat`](/api/interfaces#istat) objects. Each `Stat` computes its own final value by applying modifiers (`FLAT` then `PERCENT`) with **lazy evaluation**. See [Stats and modifiers](/guide/stats).

### ExperienceManager
Knows only about XP and levels. It exposes the `onLevelUp` and `onXPGained` callbacks that the facade wires to the Event Bus. It supports `LINEAR`, `EXPONENTIAL` and `CUSTOM_TABLE` curves. See [Experience and levels](/guide/experience).

### SkillManager
Manages the skill tree as a graph (DAG). It receives **via dependency injection** both the `StatManager` (to inject passive modifiers) and the `EngineEventBus`. See [Skill tree](/guide/skill-tree).

### EngineEventBus
A **strongly typed** pub/sub bus. It is the only communication channel to the outside. See [Event Bus](/guide/events).

## The flow that ties it all together: the level up

The most interesting internal binding happens in the facade's constructor (`setupInternalBindings`). It shows how the modules, though decoupled, collaborate:

```
exp.gainExperience(250)
        │
        ▼
ExperienceManager detects the level up
        │
        ├──▶ onLevelUp  ──▶  skills.addSkillPoints(levelsGained * 2)
        │                    events.emit('LEVEL_UP', {...})
        │
        └──▶ onXPGained ──▶  events.emit('XP_GAINED', {...})
```

Note the design detail: the `ExperienceManager` **knows nothing** about either the `SkillManager` or the Event Bus. It only exposes callbacks. It is the facade that decides that "leveling up grants 2 skill points". This keeps the modules replaceable and testable in isolation.

## Why this design

- **Testability:** each module can be tested on its own (the suite has 100% coverage).
- **Replaceability:** you can swap the XP curve or the skill tree without touching the rest.
- **UI agnostic:** Phaser, React, or a headless server all listen to the same events.
- **No persisted derived state:** only raw data is saved, everything else is recalculated.
