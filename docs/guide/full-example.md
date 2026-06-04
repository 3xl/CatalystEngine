# Full example: Mini RPG

This demo brings together **all** the engine's concepts in a single game loop. It is the best way to see how the subsystems collaborate while staying decoupled.

<Demo name="mini-rpg" title="Mini RPG — the complete loop" :height="400" />

## The loop, concept by concept

Every action in the demo touches a different subsystem:

1. **Attack** → reads the `attack` stat ([StatManager](/guide/stats)). The damage is the final value, modifiers included.
2. **Defeat an enemy** → `gainExperience()` ([ExperienceManager](/guide/experience)) accumulates XP and may trigger a level up.
3. **Level up** → the `LEVEL_UP` event ([Event Bus](/guide/events)) updates the UI and the facade grants **2 skill points** per level.
4. **Upgrade Brute Force** → `upgradeSkill()` ([SkillManager](/guide/skill-tree)) spends the points and **injects a passive modifier** into the `attack` stat.
5. **The next hit is stronger** → back to step 1, but with a higher `attack`. The circle closes.
6. **Save / Load** → snapshot [persistence](/guide/persistence): save the minimal state and restore it, with the passives re-injected.

## What it demonstrates about the architecture

The important thing is not what the demo does, but **how** it is built:

- The UI (the bars, the log, the floating numbers) **does not know** the game logic. It only reacts to the `XP_GAINED` and `LEVEL_UP` events.
- The `SkillManager` modifies the `attack` stat **without** the `StatManager` knowing that skills exist: it communicates by injecting a [per-source modifier](/guide/stats#source-based-management).
- The entire game state reduces to a small JSON. No derived value is saved.

This is CatalystEngine's strength: each piece does one thing only, the pieces talk to each other only through explicit contracts (events and modifiers), and the result is a system you can extend or reconnect to any frontend.

## The equivalent code

The skeleton of what the demo does, in a few lines:

```typescript
import { CatalystEngine, ModifierType } from 'catalyst-engine';

const engine = new CatalystEngine(
  { attack: 8 },
  { type: 'EXPONENTIAL', baseXP: 60, multiplier: 1.4 }
);

engine.skills.loadSkillTree([
  {
    id: 'brute_force', name: 'Brute Force', description: '+5 ATK/lvl',
    maxLevel: 5, currentLevel: 0, requiredPlayerLevel: 1,
    prerequisiteSkillIds: [], pointCostPerLevel: 1, type: 'PASSIVE',
    passiveModifiers: [{ id: 'fb', source: 'attack', type: ModifierType.FLAT, value: 5 }],
  },
]);

// The UI listens, it does not query
engine.events.on('LEVEL_UP', ({ currentLevel }) => hud.setLevel(currentLevel));
engine.events.on('XP_GAINED', ({ percentage }) => hud.setXpBar(percentage));

// Combat loop
function onEnemyDefeated(reward: number) {
  engine.exp.gainExperience(reward);          // → may emit LEVEL_UP
}

function onUpgrade() {
  engine.skills.upgradeSkill('brute_force', engine.exp.currentLevel); // → upgrades attack
}

function attackDamage() {
  return engine.stats.getStatValue('attack'); // final value, passives included
}
```
