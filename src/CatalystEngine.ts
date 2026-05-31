import { StatManager } from './core/StatManager';
import { ExperienceManager } from './core/ExperienceManager';
import { EngineEventBus } from './core/EngineEventBus';
import { SkillManager } from './core/SkillManager';
import { IExperienceConfig } from './interfaces/experience';
import { IEngineSaveState } from './interfaces/index';
import { IStatModifier } from './interfaces/stats';

export class CatalystEngine {
    public stats: StatManager;
    public exp: ExperienceManager;
    public events: EngineEventBus;
    public skills: SkillManager;

    constructor(statsConfig: Record<string, number>, expConfig: IExperienceConfig) {
        this.events = new EngineEventBus();
        this.stats = new StatManager();
        this.stats.initialize(statsConfig);

        this.exp = new ExperienceManager(expConfig);
        this.skills = new SkillManager(this.stats, this.events);

        this.setupInternalBindings();
    }

    private setupInternalBindings(): void {
        this.exp.onLevelUp = (result) => {
            this.skills.addSkillPoints(result.levelsGained * 2);
            this.events.emit('LEVEL_UP', {
                currentLevel: result.currentLevel,
                levelsGained: result.levelsGained,
                excessXP: result.excessXP
            });
        };

        this.exp.onXPGained = (current, nextRequired) => {
            this.events.emit('XP_GAINED', {
                currentXP: current,
                nextRequiredXP: nextRequired,
                percentage: nextRequired > 0 ? (current / nextRequired) : 1
            });
        };
    }

    public addModifier(statId: string, modifier: IStatModifier): void {
        this.stats.addModifier(statId, modifier);
        const stat = this.stats.getStat(statId);
        if (stat) {
            this.events.emit('STAT_CHANGED', {
                statId,
                newValue: stat.value,
                baseValue: stat.baseValue
            });
        }
    }

    public save(): IEngineSaveState {
        return {
            version: '1.0.0',
            timestamp: Date.now(),
            experience: {
                currentLevel: this.exp.currentLevel,
                currentXP: this.exp.currentXP
            },
            stats: {
                baseValues: this.stats.exportState()
            },
            skills: this.skills.exportState()
        };
    }

    public load(saveState: IEngineSaveState): void {
        (this.exp as any)._currentLevel = saveState.experience.currentLevel;
        (this.exp as any)._currentXP = saveState.experience.currentXP;
        this.stats.importState(saveState.stats.baseValues);
        this.skills.importState(saveState.skills);

        this.events.emit('LEVEL_UP', {
            currentLevel: this.exp.currentLevel,
            levelsGained: 0,
            excessXP: this.exp.currentXP
        });
    }
}
