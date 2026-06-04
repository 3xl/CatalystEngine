import { ISkillNode, ISkillUnlockResult } from '../interfaces/skills';
import { StatManager } from './StatManager';
import { EngineEventBus } from './EngineEventBus';

export class SkillManager {
    private skillTree: Map<string, ISkillNode> = new Map();
    private _skillPoints: number = 0;
    private statManager: StatManager;
    private eventBus: EngineEventBus;

    constructor(statManager: StatManager, eventBus: EngineEventBus) {
        this.statManager = statManager;
        this.eventBus = eventBus;
    }

    public get skillPoints(): number { return this._skillPoints; }

    public loadSkillTree(config: ISkillNode[]): void {
        config.forEach(skill => {
            this.skillTree.set(skill.id, { ...skill, currentLevel: 0 });
        });
    }

    public addSkillPoints(points: number): void {
        this._skillPoints += points;
    }

    public getSkill(skillId: string): ISkillNode | undefined {
        return this.skillTree.get(skillId);
    }

    public upgradeSkill(skillId: string, playerLevel: number): ISkillUnlockResult {
        const skill = this.skillTree.get(skillId);

        if (!skill) return { success: false, reason: 'NOT_FOUND' };
        if (skill.currentLevel >= skill.maxLevel) return { success: false, reason: 'MAX_LEVEL' };
        if (this._skillPoints < skill.pointCostPerLevel) return { success: false, reason: 'NO_POINTS' };
        if (playerLevel < skill.requiredPlayerLevel) return { success: false, reason: 'LOW_LEVEL' };

        for (const prereqId of skill.prerequisiteSkillIds) {
            const prereqSkill = this.skillTree.get(prereqId);
            if (!prereqSkill || prereqSkill.currentLevel === 0) {
                return { success: false, reason: 'MISSING_PREREQUISITES' };
            }
        }

        this._skillPoints -= skill.pointCostPerLevel;
        skill.currentLevel++;

        if (skill.type === 'PASSIVE' && skill.passiveModifiers) {
            skill.passiveModifiers.forEach(mod => {
                const uniqueMod = {
                    ...mod,
                    id: `${skill.id}_lvl_${skill.currentLevel}`,
                    source: skill.id,
                    value: mod.value * skill.currentLevel
                };

                if (skill.currentLevel > 1) {
                    this.statManager.getStat(mod.source)?.removeModifiersBySource(skill.id);
                }

                this.statManager.addModifier(mod.source, uniqueMod);
            });
        }

        this.eventBus.emit('STAT_CHANGED', {
            statId: 'skill_tree',
            newValue: this._skillPoints,
            baseValue: 0
        });

        return { success: true };
    }

    public exportState() {
        const unlockedSkills: Record<string, number> = {};
        this.skillTree.forEach((skill, id) => {
            if (skill.currentLevel > 0) {
                unlockedSkills[id] = skill.currentLevel;
            }
        });
        return { unspentPoints: this._skillPoints, unlockedSkills };
    }

    public importState(state: { unspentPoints: number; unlockedSkills: Record<string, number> }): void {
        this._skillPoints = state.unspentPoints;
        this.skillTree.forEach(skill => { skill.currentLevel = 0; });

        for (const [id, level] of Object.entries(state.unlockedSkills)) {
            const skill = this.skillTree.get(id);
            if (skill) {
                skill.currentLevel = level;
                if (skill.type === 'PASSIVE' && skill.passiveModifiers) {
                    skill.passiveModifiers.forEach(mod => {
                        this.statManager.addModifier(mod.source, {
                            ...mod,
                            id: `${skill.id}_lvl_${level}`,
                            source: skill.id,
                            value: mod.value * level
                        });
                    });
                }
            }
        }
    }
}
