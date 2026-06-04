# Skill tree

The [`SkillManager`](/api/skill-manager) manages skills as a **directed graph (DAG)**: each node declares level and unlock prerequisites, and can be defined entirely via JSON.

## Defining a skill node

A node is an [`ISkillNode`](/api/interfaces#iskillnode):

```typescript
interface ISkillNode {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;          // always reset to zero on load
  requiredPlayerLevel: number;   // minimum player level
  prerequisiteSkillIds: string[];// skills that must already be unlocked
  pointCostPerLevel: number;     // points spent per upgrade
  passiveModifiers?: IStatModifier[];
  type: 'PASSIVE' | 'ACTIVE';
}
```

## Loading the tree from JSON

```typescript
engine.skills.loadSkillTree([
  {
    id: 'brute_force',
    name: 'Brute Force',
    description: '+5 attack per level',
    maxLevel: 3,
    currentLevel: 0,
    requiredPlayerLevel: 1,
    prerequisiteSkillIds: [],
    pointCostPerLevel: 1,
    type: 'PASSIVE',
    passiveModifiers: [
      { id: 'fb', source: 'attack', type: ModifierType.FLAT, value: 5 },
    ],
  },
  {
    id: 'critical_strike',
    name: 'Critical Strike',
    description: 'Unlockable after Brute Force',
    maxLevel: 1,
    currentLevel: 0,
    requiredPlayerLevel: 5,
    prerequisiteSkillIds: ['brute_force'], // ← dependency in the DAG
    pointCostPerLevel: 2,
    type: 'ACTIVE',
  },
]);
```

`loadSkillTree` forces `currentLevel: 0` on every node: the tree always starts "off".

## Skill points

Points are earned by leveling up (2 per level, handled by the facade) or manually:

```typescript
engine.skills.addSkillPoints(5);
engine.skills.skillPoints; // number (read-only)
```

## Upgrading a skill

`upgradeSkill(skillId, playerLevel)` runs **all the checks** and returns an [`ISkillUnlockResult`](/api/interfaces#iskillunlockresult):

```typescript
const result = engine.skills.upgradeSkill('brute_force', engine.exp.currentLevel);

if (result.success) {
  // skill upgraded
} else {
  // result.reason explains why it failed
}
```

### The checks, in order

The upgrade fails at the **first** unmet condition, with an explicit `reason`:

| `reason` | Meaning |
| --- | --- |
| `NOT_FOUND` | the skill does not exist in the tree |
| `MAX_LEVEL` | the skill is already at maximum level |
| `NO_POINTS` | insufficient skill points |
| `LOW_LEVEL` | the player's level is too low |
| `MISSING_PREREQUISITES` | a prerequisite is not yet unlocked (`currentLevel === 0`) |

## Passive modifiers: injection into stats

When you upgrade a `PASSIVE` skill with `passiveModifiers`, the `SkillManager` **injects the modifiers into the `StatManager`**, scaling them by the level reached and tagging them with the skill as the `source`:

```
injected value = mod.value × currentLevel
source         = skill.id
id             = `${skill.id}_lvl_${currentLevel}`
```

As the level rises, the previous level's modifier (tagged with the same `source`) is **removed and replaced**, avoiding double accumulation. Each upgrade also emits a `STAT_CHANGED` event.

This is where [skills](/guide/skill-tree) and [stats](/guide/stats) meet: the tree is the cause, the per-source modifiers are the effect.

## Persisting the tree

`exportState()` saves only **unspent points** and **unlocked skills** (`id → level`). `importState()` reconstructs the state and **re-injects** the passive modifiers. See [Persistence](/guide/persistence).

## Try it

Green nodes are at maximum, highlighted ones are upgradeable, grey ones are locked. Click a locked node to see the failure **`reason`**. Upgrade `Strength` to unlock the prerequisites of `Lunge`/`Fury`, and watch the **ATK** rise as passive modifiers are injected into the stat. `Mastery` requires level 5 and two prerequisites.

<Demo name="skill-tree" title="Skill Tree — DAG, prerequisites and passive modifiers" :height="380" />
