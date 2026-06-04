export type EngineEvents = {
    'STAT_CHANGED': { statId: string; newValue: number; baseValue: number };
    'LEVEL_UP': { currentLevel: number; levelsGained: number; excessXP: number };
    'XP_GAINED': { currentXP: number; nextRequiredXP: number; percentage: number };
};

export type EventCallback<T> = (data: T) => void;

export interface IEngineSaveState {
    version: string;
    timestamp: number;
    experience: {
        currentLevel: number;
        currentXP: number;
    };
    stats: {
        baseValues: Record<string, number>;
    };
    skills: {
        unspentPoints: number;
        unlockedSkills: Record<string, number>;
    };
}
