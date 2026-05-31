import { describe, it, expect, beforeEach } from 'vitest';
import { SkillManager } from '../src/core/SkillManager';
import { StatManager } from '../src/core/StatManager';
import { EngineEventBus } from '../src/core/EngineEventBus';
import { ISkillNode } from '../src/interfaces/skills';
import { ModifierType } from '../src/interfaces/stats';

function tree(): ISkillNode[] {
    return [
        {
            id: 'might',
            name: 'Might',
            description: 'Raises attack',
            maxLevel: 3,
            currentLevel: 5, // intentionally non-zero to prove loadSkillTree resets it
            requiredPlayerLevel: 1,
            prerequisiteSkillIds: [],
            pointCostPerLevel: 1,
            passiveModifiers: [{ id: 'seed', source: 'atk', type: ModifierType.FLAT, value: 5 }],
            type: 'PASSIVE',
        },
        {
            id: 'cleave',
            name: 'Cleave',
            description: 'An active strike',
            maxLevel: 1,
            currentLevel: 0,
            requiredPlayerLevel: 1,
            prerequisiteSkillIds: ['might'],
            pointCostPerLevel: 1,
            type: 'ACTIVE',
        },
        {
            id: 'stance',
            name: 'Stance',
            description: 'Passive without modifiers',
            maxLevel: 1,
            currentLevel: 0,
            requiredPlayerLevel: 1,
            prerequisiteSkillIds: [],
            pointCostPerLevel: 1,
            type: 'PASSIVE',
        },
        {
            id: 'highreq',
            name: 'High Requirement',
            description: 'Needs a high player level',
            maxLevel: 1,
            currentLevel: 0,
            requiredPlayerLevel: 10,
            prerequisiteSkillIds: [],
            pointCostPerLevel: 1,
            type: 'PASSIVE',
        },
        {
            id: 'badprereq',
            name: 'Bad Prerequisite',
            description: 'Depends on a missing skill',
            maxLevel: 1,
            currentLevel: 0,
            requiredPlayerLevel: 1,
            prerequisiteSkillIds: ['does_not_exist'],
            pointCostPerLevel: 1,
            type: 'PASSIVE',
        },
        {
            id: 'ghost',
            name: 'Ghost',
            description: 'Modifier targets a stat that does not exist',
            maxLevel: 2,
            currentLevel: 0,
            requiredPlayerLevel: 1,
            prerequisiteSkillIds: [],
            pointCostPerLevel: 1,
            passiveModifiers: [{ id: 'seed', source: 'mana', type: ModifierType.FLAT, value: 3 }],
            type: 'PASSIVE',
        },
    ];
}

let stats: StatManager;
let bus: EngineEventBus;
let skills: SkillManager;

beforeEach(() => {
    stats = new StatManager();
    stats.initialize({ atk: 10 });
    bus = new EngineEventBus();
    skills = new SkillManager(stats, bus);
    skills.loadSkillTree(tree());
});

describe('SkillManager', () => {
    it('loads the tree and resets every node to level 0', () => {
        expect(skills.getSkill('might')!.currentLevel).toBe(0);
    });

    it('tracks skill points', () => {
        expect(skills.skillPoints).toBe(0);
        skills.addSkillPoints(4);
        expect(skills.skillPoints).toBe(4);
    });

    it('returns undefined for an unknown skill', () => {
        expect(skills.getSkill('nope')).toBeUndefined();
    });

    describe('upgradeSkill failures', () => {
        it('reports NOT_FOUND for an unknown skill', () => {
            expect(skills.upgradeSkill('nope', 99)).toEqual({ success: false, reason: 'NOT_FOUND' });
        });

        it('reports NO_POINTS when there are not enough points', () => {
            expect(skills.upgradeSkill('might', 99)).toEqual({ success: false, reason: 'NO_POINTS' });
        });

        it('reports LOW_LEVEL when the player level is too low', () => {
            skills.addSkillPoints(1);
            expect(skills.upgradeSkill('highreq', 1)).toEqual({ success: false, reason: 'LOW_LEVEL' });
        });

        it('reports MISSING_PREREQUISITES when a prerequisite is not yet unlocked', () => {
            skills.addSkillPoints(1);
            expect(skills.upgradeSkill('cleave', 99)).toEqual({
                success: false,
                reason: 'MISSING_PREREQUISITES',
            });
        });

        it('reports MISSING_PREREQUISITES when a prerequisite skill does not exist', () => {
            skills.addSkillPoints(1);
            expect(skills.upgradeSkill('badprereq', 99)).toEqual({
                success: false,
                reason: 'MISSING_PREREQUISITES',
            });
        });

        it('reports MAX_LEVEL once the skill is maxed out', () => {
            skills.addSkillPoints(5);
            expect(skills.upgradeSkill('stance', 99).success).toBe(true);
            expect(skills.upgradeSkill('stance', 99)).toEqual({ success: false, reason: 'MAX_LEVEL' });
        });
    });

    describe('upgradeSkill success', () => {
        it('spends points, injects a passive modifier and emits STAT_CHANGED', () => {
            const events: Array<{ statId: string; newValue: number }> = [];
            bus.on('STAT_CHANGED', e => events.push(e));
            skills.addSkillPoints(3);

            const result = skills.upgradeSkill('might', 1);

            expect(result).toEqual({ success: true });
            expect(skills.skillPoints).toBe(2);
            expect(skills.getSkill('might')!.currentLevel).toBe(1);
            expect(stats.getStatValue('atk')).toBe(15);
            expect(events).toEqual([{ statId: 'skill_tree', newValue: 2, baseValue: 0 }]);
        });

        it('replaces the prior modifier when leveling a passive beyond level 1', () => {
            skills.addSkillPoints(3);
            skills.upgradeSkill('might', 1); // value 5 * 1
            skills.upgradeSkill('might', 1); // removes the old mod, adds value 5 * 2
            expect(skills.getSkill('might')!.currentLevel).toBe(2);
            expect(stats.getStatValue('atk')).toBe(20);
        });

        it('upgrades an ACTIVE skill without injecting modifiers', () => {
            skills.addSkillPoints(3);
            skills.upgradeSkill('might', 1); // satisfy the prerequisite
            const before = stats.getStatValue('atk');
            expect(skills.upgradeSkill('cleave', 1)).toEqual({ success: true });
            expect(stats.getStatValue('atk')).toBe(before);
        });

        it('upgrades a passive skill that declares no modifiers', () => {
            skills.addSkillPoints(1);
            expect(skills.upgradeSkill('stance', 1)).toEqual({ success: true });
        });

        it('safely handles a modifier whose target stat does not exist', () => {
            skills.addSkillPoints(2);
            expect(skills.upgradeSkill('ghost', 1).success).toBe(true);
            expect(skills.upgradeSkill('ghost', 1).success).toBe(true); // hits the level>1 removal branch
            expect(skills.getSkill('ghost')!.currentLevel).toBe(2);
        });
    });

    describe('persistence', () => {
        it('exports only unlocked skills with their points', () => {
            skills.addSkillPoints(3);
            skills.upgradeSkill('might', 1);
            expect(skills.exportState()).toEqual({
                unspentPoints: 2,
                unlockedSkills: { might: 1 },
            });
        });

        it('imports state, resetting the tree and re-injecting passive modifiers', () => {
            skills.importState({
                unspentPoints: 7,
                unlockedSkills: {
                    might: 2, // passive with modifiers
                    cleave: 1, // active -> no injection
                    stance: 1, // passive without modifiers
                    does_not_exist: 4, // unknown id -> skipped
                },
            });

            expect(skills.skillPoints).toBe(7);
            expect(skills.getSkill('might')!.currentLevel).toBe(2);
            expect(skills.getSkill('cleave')!.currentLevel).toBe(1);
            expect(skills.getSkill('stance')!.currentLevel).toBe(1);
            // 10 base atk + (5 * level 2) = 20
            expect(stats.getStatValue('atk')).toBe(20);
        });
    });
});
