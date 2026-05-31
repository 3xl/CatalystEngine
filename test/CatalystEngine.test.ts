import { describe, it, expect, vi } from 'vitest';
import { CatalystEngine } from '../src/CatalystEngine';
import { IExperienceConfig } from '../src/interfaces/experience';
import { ISkillNode } from '../src/interfaces/skills';
import { ModifierType } from '../src/interfaces/stats';

const expConfig: IExperienceConfig = { type: 'LINEAR', baseXP: 100, multiplier: 1 };

const skillTree = (): ISkillNode[] => [
    {
        id: 'might',
        name: 'Might',
        description: 'Raises attack',
        maxLevel: 3,
        currentLevel: 0,
        requiredPlayerLevel: 1,
        prerequisiteSkillIds: [],
        pointCostPerLevel: 1,
        passiveModifiers: [{ id: 'seed', source: 'atk', type: ModifierType.FLAT, value: 5 }],
        type: 'PASSIVE',
    },
];

function build(): CatalystEngine {
    return new CatalystEngine({ hp: 100, atk: 10 }, expConfig);
}

describe('CatalystEngine', () => {
    it('wires up all four subsystems', () => {
        const engine = build();
        expect(engine.stats).toBeDefined();
        expect(engine.exp).toBeDefined();
        expect(engine.events).toBeDefined();
        expect(engine.skills).toBeDefined();
        expect(engine.stats.getStatValue('hp')).toBe(100);
    });

    it('grants 2 skill points per level and emits LEVEL_UP', () => {
        const engine = build();
        const onLevelUp = vi.fn();
        engine.events.on('LEVEL_UP', onLevelUp);

        engine.exp.gainExperience(300); // level 1 -> 3 (2 levels)

        expect(engine.skills.skillPoints).toBe(4);
        expect(onLevelUp).toHaveBeenCalledWith({ currentLevel: 3, levelsGained: 2, excessXP: 0 });
    });

    it('emits XP_GAINED with the progress percentage', () => {
        const engine = build();
        const onXP = vi.fn();
        engine.events.on('XP_GAINED', onXP);

        engine.exp.gainExperience(50); // below the level-2 threshold of 100

        expect(onXP).toHaveBeenCalledWith({ currentXP: 50, nextRequiredXP: 100, percentage: 0.5 });
    });

    it('reports a full percentage when the next requirement is zero', () => {
        const engine = build();
        const onXP = vi.fn();
        engine.events.on('XP_GAINED', onXP);

        // Drive the internal binding directly with a zero requirement.
        engine.exp.onXPGained!(50, 0);

        expect(onXP).toHaveBeenCalledWith({ currentXP: 50, nextRequiredXP: 0, percentage: 1 });
    });

    it('adds a modifier and emits STAT_CHANGED for an existing stat', () => {
        const engine = build();
        const onStat = vi.fn();
        engine.events.on('STAT_CHANGED', onStat);

        engine.addModifier('atk', { id: 'm1', source: 'sword', type: ModifierType.FLAT, value: 15 });

        expect(engine.stats.getStatValue('atk')).toBe(25);
        expect(onStat).toHaveBeenCalledWith({ statId: 'atk', newValue: 25, baseValue: 10 });
    });

    it('does not emit STAT_CHANGED for a missing stat', () => {
        const engine = build();
        const onStat = vi.fn();
        engine.events.on('STAT_CHANGED', onStat);

        engine.addModifier('missing', { id: 'm1', source: 'sword', type: ModifierType.FLAT, value: 15 });

        expect(onStat).not.toHaveBeenCalled();
    });

    it('produces a serializable snapshot', () => {
        const engine = build();
        engine.skills.loadSkillTree(skillTree());
        engine.exp.gainExperience(150);
        engine.skills.upgradeSkill('might', engine.exp.currentLevel);

        const snapshot = engine.save();

        expect(snapshot.version).toBe('1.0.0');
        expect(typeof snapshot.timestamp).toBe('number');
        expect(snapshot.experience).toEqual({ currentLevel: 2, currentXP: 50 });
        expect(snapshot.stats.baseValues).toEqual({ hp: 100, atk: 10 });
        expect(snapshot.skills).toEqual({ unspentPoints: 1, unlockedSkills: { might: 1 } });
    });

    it('restores a snapshot and emits a LEVEL_UP with no levels gained', () => {
        const engine = build();
        engine.skills.loadSkillTree(skillTree());
        const onLevelUp = vi.fn();
        engine.events.on('LEVEL_UP', onLevelUp);

        engine.load({
            version: '1.0.0',
            timestamp: 0,
            experience: { currentLevel: 5, currentXP: 42 },
            stats: { baseValues: { hp: 250, atk: 30 } },
            skills: { unspentPoints: 3, unlockedSkills: { might: 2 } },
        });

        expect(engine.exp.currentLevel).toBe(5);
        expect(engine.exp.currentXP).toBe(42);
        expect(engine.stats.getStat('hp')!.baseValue).toBe(250);
        expect(engine.skills.skillPoints).toBe(3);
        expect(engine.skills.getSkill('might')!.currentLevel).toBe(2);
        // base 30 + passive (5 * level 2) = 40
        expect(engine.stats.getStatValue('atk')).toBe(40);
        expect(onLevelUp).toHaveBeenCalledWith({ currentLevel: 5, levelsGained: 0, excessXP: 42 });
    });
});
