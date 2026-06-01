# Esempio completo: Mini RPG

Questa demo mette insieme **tutti** i concetti dell'engine in un unico loop di gioco. È il modo migliore per vedere come i sottosistemi collaborano restando disaccoppiati.

<Demo name="mini-rpg" title="Mini RPG — il loop completo" :height="400" />

## Il loop, concetto per concetto

Ogni azione della demo tocca un sottosistema diverso:

1. **Attacca** → legge la statistica `attack` ([StatManager](/guide/statistiche)). Il danno è il valore finale, modificatori inclusi.
2. **Sconfiggi un nemico** → `gainExperience()` ([ExperienceManager](/guide/esperienza)) accumula XP e può far salire di livello.
3. **Level up** → l'evento `LEVEL_UP` ([Event Bus](/guide/eventi)) aggiorna la UI e il facade assegna **2 punti skill** per livello.
4. **Potenzia Forza Bruta** → `upgradeSkill()` ([SkillManager](/guide/skill)) spende i punti e **inietta un modificatore passivo** nella statistica `attack`.
5. **Il colpo dopo è più forte** → si torna al punto 1, ma con un `attack` più alto. Il cerchio si chiude.
6. **Save / Load** → [persistenza](/guide/persistenza) a snapshot: salva lo stato minimo e ripristinalo, con i passivi ri-iniettati.

## Cosa dimostra sull'architettura

La cosa importante non è cosa fa la demo, ma **come** è costruita:

- La UI (le barre, il diario, i numeri fluttuanti) **non conosce** la logica di gioco. Reagisce solo agli eventi `XP_GAINED` e `LEVEL_UP`.
- Lo `SkillManager` modifica la statistica `attack` **senza** che lo `StatManager` sappia dell'esistenza delle skill: comunica iniettando un [modificatore per sorgente](/guide/statistiche#gestione-per-sorgente).
- L'intero stato di gioco si riduce a un piccolo JSON. Nessun valore derivato viene salvato.

Questo è il punto di forza di CatalystEngine: ogni pezzo fa una cosa sola, i pezzi si parlano solo tramite contratti espliciti (eventi e modificatori), e il risultato è un sistema che puoi estendere o ricollegare a qualsiasi frontend.

## Il codice equivalente

Lo scheletro di ciò che fa la demo, in poche righe:

```typescript
import { CatalystEngine, ModifierType } from 'catalyst-engine';

const engine = new CatalystEngine(
  { attack: 8 },
  { type: 'EXPONENTIAL', baseXP: 60, multiplier: 1.4 }
);

engine.skills.loadSkillTree([
  {
    id: 'forza', name: 'Forza Bruta', description: '+5 ATK/liv',
    maxLevel: 5, currentLevel: 0, requiredPlayerLevel: 1,
    prerequisiteSkillIds: [], pointCostPerLevel: 1, type: 'PASSIVE',
    passiveModifiers: [{ id: 'fb', source: 'attack', type: ModifierType.FLAT, value: 5 }],
  },
]);

// La UI ascolta, non interroga
engine.events.on('LEVEL_UP', ({ currentLevel }) => hud.setLevel(currentLevel));
engine.events.on('XP_GAINED', ({ percentage }) => hud.setXpBar(percentage));

// Loop di combattimento
function onEnemyDefeated(reward: number) {
  engine.exp.gainExperience(reward);          // → può emettere LEVEL_UP
}

function onUpgrade() {
  engine.skills.upgradeSkill('forza', engine.exp.currentLevel); // → potenzia attack
}

function attackDamage() {
  return engine.stats.getStatValue('attack'); // valore finale, passivi inclusi
}
```
