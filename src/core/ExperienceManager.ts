import { IExperienceConfig, ILevelUpResult } from '../interfaces/experience';

export class ExperienceManager {
    private _currentXP: number = 0;
    private _currentLevel: number = 1;
    private config: IExperienceConfig;

    public onLevelUp: ((result: ILevelUpResult) => void) | null = null;
    public onXPGained: ((currentXP: number, nextLevelXP: number) => void) | null = null;

    constructor(config: IExperienceConfig, startLevel: number = 1, startXP: number = 0) {
        this.config = config;
        this._currentLevel = startLevel;
        this._currentXP = startXP;
    }

    public get currentXP(): number { return this._currentXP; }
    public get currentLevel(): number { return this._currentLevel; }

    public getXPRequirementForLevel(level: number): number {
        if (level <= 1) return 0;

        switch (this.config.type) {
            case 'LINEAR':
                return this.config.baseXP * (level - 1);
            case 'EXPONENTIAL':
                return Math.round(this.config.baseXP * Math.pow(level - 1, this.config.multiplier));
            case 'CUSTOM_TABLE':
                if (this.config.customTable && this.config.customTable[level]) {
                    return this.config.customTable[level];
                }
                return Infinity;
            default:
                return 1000;
        }
    }

    public gainExperience(amount: number): ILevelUpResult {
        this._currentXP += amount;
        let levelsGained = 0;

        while (true) {
            const xpRequired = this.getXPRequirementForLevel(this._currentLevel + 1);
            if (this._currentXP >= xpRequired) {
                this._currentXP -= xpRequired;
                this._currentLevel++;
                levelsGained++;
            } else {
                break;
            }
        }

        const result: ILevelUpResult = {
            levelsGained,
            currentLevel: this._currentLevel,
            excessXP: this._currentXP,
            statsUpgraded: {}
        };

        if (levelsGained > 0 && this.onLevelUp) {
            this.onLevelUp(result);
        }

        if (this.onXPGained) {
            const nextRequired = this.getXPRequirementForLevel(this._currentLevel + 1);
            this.onXPGained(this._currentXP, nextRequired);
        }

        return result;
    }
}
