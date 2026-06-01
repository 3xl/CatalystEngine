---
layout: home

hero:
  name: CatalystEngine
  text: Progressione di gioco data-driven
  tagline: Un motore modulare, polimorfo e plug-and-play per TypeScript e PhaserJS. Calcola la matematica di gioco e notifica il mondo esterno tramite un Event Bus tipizzato.
  actions:
    - theme: brand
      text: Inizia subito
      link: /guide/introduzione
    - theme: alt
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: Riferimento API
      link: /api/catalyst-engine

features:
  - icon: 🧩
    title: Disaccoppiamento totale
    details: La logica comunica solo tramite l'EngineEventBus tipizzato. La UI (Phaser o altro) si limita ad ascoltare gli eventi, senza mai dipendere dal cuore dell'engine.
  - icon: ⚡
    title: Lazy evaluation
    details: Le statistiche vengono ricalcolate solo quando un modificatore cambia, e solo nel momento in cui il valore viene effettivamente richiesto. Dirty flag integrato.
  - icon: 🔖
    title: Gestione per sorgente
    details: I modificatori si aggiungono e rimuovono in base alla loro origine (es. spada_di_fuoco), non tramite ID astratti difficili da tracciare.
  - icon: 🌳
    title: Skill tree a grafo (DAG)
    details: Ogni nodo dichiara prerequisiti di livello e di sblocco, definibili interamente via JSON. Inietta modificatori passivi nelle statistiche.
  - icon: 💾
    title: Snapshot persistence
    details: save() esporta uno stato minimo (XP, livelli, skill sbloccate) in JSON puro, ideale per LocalStorage o database. load() ripristina tutto.
  - icon: 🎯
    title: Agnostico al genere
    details: Eroe fantasy, motori di un'astronave o parametri di una fazione strategica — l'engine non sa né gli importa cosa rappresentano i tuoi numeri.
---
