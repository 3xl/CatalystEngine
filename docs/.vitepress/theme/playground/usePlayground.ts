import { ref, shallowRef, computed } from 'vue';
import { CatalystEngine } from 'catalyst-engine';
import { validateDag, computeDepths, DEFAULT_STATS, DEFAULT_XP, DEFAULT_TREE } from './validate';
import type {
  PlaygroundConfig,
  Command,
  View,
  EventEntry,
  CurvePoint,
  StatView,
  SkillView,
} from './types';

function emptyView(error: string | null): View {
  return {
    ok: error === null,
    error,
    stats: [],
    exp: { level: 1, xp: 0, nextReq: 0, percentage: 0, curve: [] },
    skillPoints: 0,
    playerLevel: 1,
    skills: [],
    events: [],
    saveState: null,
    dag: [],
  };
}

function applyCommand(engine: CatalystEngine, cmd: Command) {
  switch (cmd.t) {
    case 'gainXP':
      engine.exp.gainExperience(cmd.amount);
      break;
    case 'addModifier':
      engine.addModifier(cmd.statId, cmd.mod);
      break;
    case 'removeSource':
      engine.stats.removeAllModifiersFromSource(cmd.source);
      break;
    case 'addSkillPoints':
      engine.skills.addSkillPoints(cmd.n);
      break;
    case 'upgradeSkill':
      engine.skills.upgradeSkill(cmd.skillId, engine.exp.currentLevel);
      break;
    case 'load':
      engine.load(cmd.snapshot);
      break;
  }
}

function commandToCode(cmd: Command): string {
  switch (cmd.t) {
    case 'gainXP':
      return `engine.exp.gainExperience(${cmd.amount});`;
    case 'addModifier':
      return `engine.addModifier('${cmd.statId}', { id: '${cmd.mod.id}', source: '${cmd.mod.source}', type: ModifierType.${cmd.mod.type}, value: ${cmd.mod.value} });`;
    case 'removeSource':
      return `engine.stats.removeAllModifiersFromSource('${cmd.source}');`;
    case 'addSkillPoints':
      return `engine.skills.addSkillPoints(${cmd.n});`;
    case 'upgradeSkill':
      return `engine.skills.upgradeSkill('${cmd.skillId}', engine.exp.currentLevel);`;
    case 'load':
      return `engine.load(${JSON.stringify(cmd.snapshot)});`;
  }
}

export function commandLabel(cmd: Command): string {
  switch (cmd.t) {
    case 'gainXP':
      return `+${cmd.amount} XP`;
    case 'addModifier':
      return `+mod ${cmd.statId} ${cmd.mod.type === 'PERCENT' ? cmd.mod.value * 100 + '%' : '+' + cmd.mod.value} (${cmd.mod.source})`;
    case 'removeSource':
      return `−source ${cmd.source}`;
    case 'addSkillPoints':
      return `+${cmd.n} skill pts`;
    case 'upgradeSkill':
      return `upgrade ${cmd.skillId}`;
    case 'load':
      return `load snapshot`;
  }
}

export function usePlayground() {
  const statsText = ref(DEFAULT_STATS);
  const xpText = ref(DEFAULT_XP);
  const treeText = ref(DEFAULT_TREE);

  const config = shallowRef<PlaygroundConfig | null>(null);
  const commands = ref<Command[]>([]);
  const cursor = ref(0); // number of commands applied
  const view = ref<View>(emptyView(null));
  const buildError = ref<string | null>(null);

  const isLive = computed(() => cursor.value === commands.value.length);

  function parse(): PlaygroundConfig | null {
    try {
      const stats = JSON.parse(statsText.value);
      const xp = JSON.parse(xpText.value);
      const skillTree = JSON.parse(treeText.value);
      if (typeof stats !== 'object' || stats === null || Array.isArray(stats))
        throw new Error('"stats" must be an object map of id → number');
      if (typeof xp !== 'object' || xp === null) throw new Error('"xp" must be an object');
      if (!Array.isArray(skillTree)) throw new Error('"skillTree" must be an array');
      buildError.value = null;
      return { stats, xp, skillTree };
    } catch (e) {
      buildError.value = e instanceof Error ? e.message : String(e);
      return null;
    }
  }

  function computeView(engine: CatalystEngine, cfg: PlaygroundConfig, events: EventEntry[]): View {
    const playerLevel = engine.exp.currentLevel;
    const skillPoints = engine.skills.skillPoints;

    const stats: StatView[] = Object.keys(cfg.stats).map((id) => {
      const s = engine.stats.getStat(id);
      const mods = s ? s.modifiers : [];
      const flatSum = mods.filter((m) => m.type === 'FLAT').reduce((a, m) => a + m.value, 0);
      const pctSum = mods.filter((m) => m.type === 'PERCENT').reduce((a, m) => a + m.value, 0);
      return {
        id,
        base: s ? s.baseValue : cfg.stats[id],
        value: engine.stats.getStatValue(id),
        flatSum,
        pctSum,
        modifiers: mods.map((m) => ({ id: m.id, source: m.source, type: m.type as 'FLAT' | 'PERCENT', value: m.value })),
      };
    });

    const level = engine.exp.currentLevel;
    const xp = engine.exp.currentXP;
    const nextReq = engine.exp.getXPRequirementForLevel(level + 1);
    const percentage = nextReq > 0 ? Math.min(1, xp / nextReq) : 1;
    const maxL = Math.max(12, level + 4);
    const curve: CurvePoint[] = [];
    for (let L = 2; L <= maxL; L++) curve.push({ level: L, req: engine.exp.getXPRequirementForLevel(L) });

    const depths = computeDepths(cfg.skillTree);
    const skills: SkillView[] = cfg.skillTree.map((node) => {
      const sk = engine.skills.getSkill(node.id);
      const cur = sk ? sk.currentLevel : 0;
      let state: SkillView['state'] = 'locked';
      let reason: string | null = null;
      if (cur >= node.maxLevel) {
        state = 'maxed';
      } else {
        const prereqOk = node.prerequisiteSkillIds.every(
          (p) => (engine.skills.getSkill(p)?.currentLevel ?? 0) > 0
        );
        const pointsOk = skillPoints >= node.pointCostPerLevel;
        const levelOk = playerLevel >= node.requiredPlayerLevel;
        if (prereqOk && pointsOk && levelOk) state = 'available';
        else {
          state = 'locked';
          reason = !levelOk ? 'LOW_LEVEL' : !prereqOk ? 'MISSING_PREREQUISITES' : 'NO_POINTS';
        }
      }
      return {
        id: node.id,
        name: node.name,
        currentLevel: cur,
        maxLevel: node.maxLevel,
        requiredPlayerLevel: node.requiredPlayerLevel,
        cost: node.pointCostPerLevel,
        prerequisiteSkillIds: node.prerequisiteSkillIds,
        state,
        reason,
        depth: depths[node.id] ?? 0,
      };
    });

    return {
      ok: true,
      error: null,
      stats,
      exp: { level, xp, nextReq, percentage, curve },
      skillPoints,
      playerLevel,
      skills,
      events: events.slice(-200),
      saveState: engine.save(),
      dag: validateDag(cfg.skillTree),
    };
  }

  function rebuild() {
    const cfg = config.value;
    if (!cfg) {
      view.value = emptyView(buildError.value);
      return;
    }
    try {
      const engine = new CatalystEngine(cfg.stats, cfg.xp);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      engine.skills.loadSkillTree(cfg.skillTree as any);

      const events: EventEntry[] = [];
      let seq = 0;
      const cap = (type: EventEntry['type']) => (payload: Record<string, unknown>) =>
        events.push({ seq: seq++, type, payload });
      engine.events.on('STAT_CHANGED', cap('STAT_CHANGED'));
      engine.events.on('LEVEL_UP', cap('LEVEL_UP'));
      engine.events.on('XP_GAINED', cap('XP_GAINED'));

      const upto = Math.min(cursor.value, commands.value.length);
      for (let i = 0; i < upto; i++) applyCommand(engine, commands.value[i]);

      view.value = computeView(engine, cfg, events);
    } catch (e) {
      view.value = emptyView(e instanceof Error ? e.message : String(e));
    }
  }

  function applyConfig() {
    const cfg = parse();
    if (!cfg) {
      view.value = emptyView(buildError.value);
      return;
    }
    config.value = cfg;
    commands.value = [];
    cursor.value = 0;
    rebuild();
  }

  function dispatch(cmd: Command) {
    // If we are time-travelled into the past, branch off (drop the future).
    if (cursor.value < commands.value.length) {
      commands.value = commands.value.slice(0, cursor.value);
    }
    commands.value.push(cmd);
    cursor.value = commands.value.length;
    rebuild();
  }

  function gotoCursor(i: number) {
    cursor.value = Math.max(0, Math.min(i, commands.value.length));
    rebuild();
  }

  function reset() {
    commands.value = [];
    cursor.value = 0;
    rebuild();
  }

  function exportVitest(): string {
    const cfg = config.value;
    if (!cfg) return '';
    const engine = new CatalystEngine(cfg.stats, cfg.xp);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    engine.skills.loadSkillTree(cfg.skillTree as any);
    for (const c of commands.value) applyCommand(engine, c);

    const L: string[] = [];
    L.push("import { describe, it, expect } from 'vitest';");
    L.push("import { CatalystEngine, ModifierType } from 'catalyst-engine';");
    L.push('');
    L.push("describe('CatalystEngine scenario', () => {");
    L.push("  it('reproduces the recorded sequence', () => {");
    L.push(`    const engine = new CatalystEngine(${JSON.stringify(cfg.stats)}, ${JSON.stringify(cfg.xp)});`);
    L.push(`    engine.skills.loadSkillTree(${JSON.stringify(cfg.skillTree)} as any);`);
    if (commands.value.length) L.push('');
    for (const c of commands.value) L.push('    ' + commandToCode(c));
    L.push('');
    L.push(`    expect(engine.exp.currentLevel).toBe(${engine.exp.currentLevel});`);
    L.push(`    expect(engine.skills.skillPoints).toBe(${engine.skills.skillPoints});`);
    for (const id of Object.keys(cfg.stats))
      L.push(`    expect(engine.stats.getStatValue('${id}')).toBe(${engine.stats.getStatValue(id)});`);
    for (const node of cfg.skillTree) {
      const lvl = engine.skills.getSkill(node.id)?.currentLevel ?? 0;
      L.push(`    expect(engine.skills.getSkill('${node.id}')?.currentLevel).toBe(${lvl});`);
    }
    L.push('  });');
    L.push('});');
    L.push('');
    return L.join('\n');
  }

  // boot with the default config
  applyConfig();

  return {
    statsText,
    xpText,
    treeText,
    config,
    commands,
    cursor,
    view,
    buildError,
    isLive,
    applyConfig,
    dispatch,
    gotoCursor,
    reset,
    exportVitest,
  };
}

export type Playground = ReturnType<typeof usePlayground>;
