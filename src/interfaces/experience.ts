export type CurveType = 'LINEAR' | 'EXPONENTIAL' | 'CUSTOM_TABLE';

export interface IExperienceConfig {
    type: CurveType;
    baseXP: number;
    multiplier: number;
    customTable?: number[];
}

export interface ILevelUpResult {
    levelsGained: number;
    currentLevel: number;
    excessXP: number;
    statsUpgraded: Record<string, number>;
}
