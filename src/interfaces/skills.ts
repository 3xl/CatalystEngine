import { IStatModifier } from './stats';

export interface ISkillNode {
    id: string;
    name: string;
    description: string;
    maxLevel: number;
    currentLevel: number;
    requiredPlayerLevel: number;
    prerequisiteSkillIds: string[];
    pointCostPerLevel: number;
    passiveModifiers?: IStatModifier[];
    type: 'PASSIVE' | 'ACTIVE';
}

export interface ISkillUnlockResult {
    success: boolean;
    reason?: 'LOW_LEVEL' | 'MISSING_PREREQUISITES' | 'NO_POINTS' | 'MAX_LEVEL' | 'NOT_FOUND';
}
