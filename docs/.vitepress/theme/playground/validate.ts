import type { ISkillNode, DagIssue } from './types';

/** Default config the playground opens with (a small RPG). */
export const DEFAULT_STATS = `{
  "hp": 100,
  "attack": 10,
  "defense": 5
}`;

export const DEFAULT_XP = `{
  "type": "EXPONENTIAL",
  "baseXP": 100,
  "multiplier": 1.5
}`;

export const DEFAULT_TREE = `[
  {
    "id": "brute_force", "name": "Brute Force", "description": "+5 ATK/lvl",
    "maxLevel": 3, "currentLevel": 0, "requiredPlayerLevel": 1,
    "prerequisiteSkillIds": [], "pointCostPerLevel": 1, "type": "PASSIVE",
    "passiveModifiers": [{ "id": "fb", "source": "attack", "type": "FLAT", "value": 5 }]
  },
  {
    "id": "lunge", "name": "Lunge", "description": "+8 ATK",
    "maxLevel": 1, "currentLevel": 0, "requiredPlayerLevel": 2,
    "prerequisiteSkillIds": ["brute_force"], "pointCostPerLevel": 1, "type": "PASSIVE",
    "passiveModifiers": [{ "id": "af", "source": "attack", "type": "FLAT", "value": 8 }]
  },
  {
    "id": "fury", "name": "Fury", "description": "+15% ATK/lvl",
    "maxLevel": 2, "currentLevel": 0, "requiredPlayerLevel": 3,
    "prerequisiteSkillIds": ["brute_force"], "pointCostPerLevel": 2, "type": "PASSIVE",
    "passiveModifiers": [{ "id": "fu", "source": "attack", "type": "PERCENT", "value": 0.15 }]
  },
  {
    "id": "mastery", "name": "Mastery", "description": "+25% ATK",
    "maxLevel": 1, "currentLevel": 0, "requiredPlayerLevel": 5,
    "prerequisiteSkillIds": ["lunge", "fury"], "pointCostPerLevel": 3, "type": "PASSIVE",
    "passiveModifiers": [{ "id": "ma", "source": "attack", "type": "PERCENT", "value": 0.25 }]
  }
]`;

/**
 * Static analysis of the skill-tree DAG: duplicate ids, dangling
 * prerequisites, cycles, and level-gating inconsistencies.
 */
export function validateDag(tree: ISkillNode[]): DagIssue[] {
  const issues: DagIssue[] = [];
  const ids = new Set<string>();
  const byId = new Map<string, ISkillNode>();

  for (const node of tree) {
    if (ids.has(node.id)) {
      issues.push({ severity: 'error', msg: `Duplicate skill id "${node.id}"` });
    }
    ids.add(node.id);
    byId.set(node.id, node);
  }

  for (const node of tree) {
    for (const pre of node.prerequisiteSkillIds) {
      if (!byId.has(pre)) {
        issues.push({
          severity: 'error',
          msg: `"${node.id}" requires "${pre}", which does not exist`,
        });
      } else {
        const p = byId.get(pre)!;
        if (p.requiredPlayerLevel > node.requiredPlayerLevel) {
          issues.push({
            severity: 'warn',
            msg: `"${node.id}" (lvl ${node.requiredPlayerLevel}) requires "${pre}" which unlocks later (lvl ${p.requiredPlayerLevel})`,
          });
        }
      }
    }
  }

  // Cycle detection (DFS with colors)
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  tree.forEach((n) => color.set(n.id, WHITE));
  const cycleNodes = new Set<string>();

  function dfs(id: string): boolean {
    color.set(id, GRAY);
    const node = byId.get(id);
    for (const pre of node?.prerequisiteSkillIds ?? []) {
      if (!byId.has(pre)) continue;
      const c = color.get(pre);
      if (c === GRAY) {
        cycleNodes.add(pre);
        return true;
      }
      if (c === WHITE && dfs(pre)) {
        cycleNodes.add(pre);
        return true;
      }
    }
    color.set(id, BLACK);
    return false;
  }

  for (const node of tree) {
    if (color.get(node.id) === WHITE) dfs(node.id);
  }
  if (cycleNodes.size) {
    issues.push({
      severity: 'error',
      msg: `Cycle in prerequisites involving: ${[...cycleNodes].join(', ')}`,
    });
  }

  return issues;
}

/** Longest prerequisite chain per node (for layered graph layout). Cycle-safe. */
export function computeDepths(tree: ISkillNode[]): Record<string, number> {
  const byId = new Map(tree.map((n) => [n.id, n]));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  function depth(id: string): number {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const node = byId.get(id);
    const pres = (node?.prerequisiteSkillIds ?? []).filter((p) => byId.has(p));
    const d = pres.length ? 1 + Math.max(...pres.map(depth)) : 0;
    visiting.delete(id);
    memo.set(id, d);
    return d;
  }

  const out: Record<string, number> = {};
  for (const n of tree) out[n.id] = depth(n.id);
  return out;
}
