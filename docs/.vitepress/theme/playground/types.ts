import type {
  IStatModifier,
  IExperienceConfig,
  ISkillNode,
  IEngineSaveState,
} from 'catalyst-engine';

export interface PlaygroundConfig {
  stats: Record<string, number>;
  xp: IExperienceConfig;
  skillTree: ISkillNode[];
}

/** A recorded, serializable action. State = config + replay(commands). */
export type Command =
  | { t: 'gainXP'; amount: number }
  | { t: 'addModifier'; statId: string; mod: IStatModifier }
  | { t: 'removeSource'; source: string }
  | { t: 'addSkillPoints'; n: number }
  | { t: 'upgradeSkill'; skillId: string }
  | { t: 'load'; snapshot: IEngineSaveState };

export interface ModView {
  id: string;
  source: string;
  type: 'FLAT' | 'PERCENT';
  value: number;
}

export interface StatView {
  id: string;
  base: number;
  value: number;
  flatSum: number;
  pctSum: number;
  modifiers: ModView[];
}

export interface CurvePoint {
  level: number;
  req: number;
}

export interface SkillView {
  id: string;
  name: string;
  currentLevel: number;
  maxLevel: number;
  requiredPlayerLevel: number;
  cost: number;
  prerequisiteSkillIds: string[];
  state: 'maxed' | 'available' | 'locked';
  reason: string | null;
  depth: number;
}

export interface EventEntry {
  seq: number;
  type: 'STAT_CHANGED' | 'LEVEL_UP' | 'XP_GAINED';
  payload: Record<string, unknown>;
}

export interface DagIssue {
  severity: 'error' | 'warn';
  msg: string;
}

export interface View {
  ok: boolean;
  error: string | null;
  stats: StatView[];
  exp: {
    level: number;
    xp: number;
    nextReq: number;
    percentage: number;
    curve: CurvePoint[];
  };
  skillPoints: number;
  playerLevel: number;
  skills: SkillView[];
  events: EventEntry[];
  saveState: IEngineSaveState | null;
  dag: DagIssue[];
}

export type { IStatModifier, IExperienceConfig, ISkillNode, IEngineSaveState };
