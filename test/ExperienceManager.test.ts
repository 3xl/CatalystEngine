import { describe, it, expect, vi } from 'vitest';
import { ExperienceManager } from '../src/core/ExperienceManager';
import { IExperienceConfig } from '../src/interfaces/experience';

const linear: IExperienceConfig = { type: 'LINEAR', baseXP: 100, multiplier: 1 };
const exponential: IExperienceConfig = { type: 'EXPONENTIAL', baseXP: 100, multiplier: 2 };

describe('ExperienceManager', () => {
    it('exposes the starting level and xp', () => {
        const manager = new ExperienceManager(linear, 3, 40);
        expect(manager.currentLevel).toBe(3);
        expect(manager.currentXP).toBe(40);
    });

    it('defaults to level 1 with 0 xp', () => {
        const manager = new ExperienceManager(linear);
        expect(manager.currentLevel).toBe(1);
        expect(manager.currentXP).toBe(0);
    });

    describe('getXPRequirementForLevel', () => {
        it('requires 0 xp for level 1 and below', () => {
            const manager = new ExperienceManager(linear);
            expect(manager.getXPRequirementForLevel(1)).toBe(0);
            expect(manager.getXPRequirementForLevel(0)).toBe(0);
        });

        it('computes a LINEAR curve', () => {
            const manager = new ExperienceManager(linear);
            expect(manager.getXPRequirementForLevel(2)).toBe(100);
            expect(manager.getXPRequirementForLevel(4)).toBe(300);
        });

        it('computes an EXPONENTIAL curve', () => {
            const manager = new ExperienceManager(exponential);
            // 100 * (level-1)^2
            expect(manager.getXPRequirementForLevel(3)).toBe(400);
        });

        it('reads a CUSTOM_TABLE when the entry exists', () => {
            const manager = new ExperienceManager({
                type: 'CUSTOM_TABLE',
                baseXP: 0,
                multiplier: 0,
                customTable: [0, 0, 500, 1500],
            });
            expect(manager.getXPRequirementForLevel(2)).toBe(500);
            expect(manager.getXPRequirementForLevel(3)).toBe(1500);
        });

        it('returns Infinity for a CUSTOM_TABLE entry beyond the table', () => {
            const manager = new ExperienceManager({
                type: 'CUSTOM_TABLE',
                baseXP: 0,
                multiplier: 0,
                customTable: [0, 0, 500],
            });
            expect(manager.getXPRequirementForLevel(9)).toBe(Infinity);
        });

        it('returns Infinity for a CUSTOM_TABLE without a table', () => {
            const manager = new ExperienceManager({
                type: 'CUSTOM_TABLE',
                baseXP: 0,
                multiplier: 0,
            });
            expect(manager.getXPRequirementForLevel(2)).toBe(Infinity);
        });

        it('falls back to 1000 for an unknown curve type', () => {
            const manager = new ExperienceManager({
                type: 'NOPE' as any,
                baseXP: 100,
                multiplier: 1,
            });
            expect(manager.getXPRequirementForLevel(2)).toBe(1000);
        });
    });

    describe('gainExperience', () => {
        it('levels up once and fires both callbacks', () => {
            const manager = new ExperienceManager(linear);
            const onLevelUp = vi.fn();
            const onXPGained = vi.fn();
            manager.onLevelUp = onLevelUp;
            manager.onXPGained = onXPGained;

            const result = manager.gainExperience(120);

            expect(result.levelsGained).toBe(1);
            expect(result.currentLevel).toBe(2);
            expect(result.excessXP).toBe(20);
            expect(result.statsUpgraded).toEqual({});
            expect(onLevelUp).toHaveBeenCalledWith(result);
            // next requirement for level 3 is 200
            expect(onXPGained).toHaveBeenCalledWith(20, 200);
        });

        it('levels up multiple times in a single gain', () => {
            const manager = new ExperienceManager(linear);
            const result = manager.gainExperience(300); // 100 -> L2, 200 -> L3
            expect(result.levelsGained).toBe(2);
            expect(result.currentLevel).toBe(3);
            expect(result.excessXP).toBe(0);
        });

        it('does not level up when xp is below the threshold', () => {
            const manager = new ExperienceManager(linear);
            const onLevelUp = vi.fn();
            manager.onLevelUp = onLevelUp;
            const result = manager.gainExperience(50);
            expect(result.levelsGained).toBe(0);
            expect(manager.currentXP).toBe(50);
            expect(onLevelUp).not.toHaveBeenCalled();
        });

        it('does not throw when callbacks are not set', () => {
            const manager = new ExperienceManager(linear);
            expect(() => manager.gainExperience(120)).not.toThrow();
            expect(manager.currentLevel).toBe(2);
        });
    });
});
