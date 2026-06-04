---
layout: home

hero:
  name: CatalystEngine
  text: Data-driven game progression
  tagline: A modular, polymorphic and plug-and-play engine for TypeScript and PhaserJS. It computes the game math and notifies the outside world through a typed Event Bus.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: API reference
      link: /api/catalyst-engine

features:
  - icon: 🧩
    title: Total decoupling
    details: The logic communicates only through the typed EngineEventBus. The UI (Phaser or otherwise) merely listens to events, never depending on the heart of the engine.
  - icon: ⚡
    title: Lazy evaluation
    details: Stats are recalculated only when a modifier changes, and only at the moment the value is actually requested. Built-in dirty flag.
  - icon: 🔖
    title: Source-based management
    details: Modifiers are added and removed based on their origin (e.g. fire_sword), not via abstract IDs that are hard to track.
  - icon: 🌳
    title: Graph-based skill tree (DAG)
    details: Every node declares level and unlock prerequisites, fully definable via JSON. It injects passive modifiers into the stats.
  - icon: 💾
    title: Snapshot persistence
    details: save() exports a minimal state (XP, levels, unlocked skills) as pure JSON, ideal for LocalStorage or a database. load() restores everything.
  - icon: 🎯
    title: Genre-agnostic
    details: A fantasy hero, a spaceship's engines or a strategic faction's parameters — the engine neither knows nor cares what your numbers represent.
---
