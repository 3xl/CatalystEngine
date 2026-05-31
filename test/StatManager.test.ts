import { describe, it, expect } from 'vitest';
import { StatManager } from '../src/core/StatManager';
import { ModifierType, IStatModifier } from '../src/interfaces/stats';

const mod = (id: string, source: string, value: number): IStatModifier => ({
    id,
    source,
    type: ModifierType.FLAT,
    value,
});

function build(): StatManager {
    const manager = new StatManager();
    manager.initialize({ hp: 100, atk: 10 });
    return manager;
}

describe('StatManager', () => {
    it('initializes stats with an uppercased name', () => {
        const manager = build();
        const hp = manager.getStat('hp');
        expect(hp).toBeDefined();
        expect(hp!.name).toBe('HP');
        expect(hp!.baseValue).toBe(100);
    });

    it('returns undefined for an unknown stat', () => {
        const manager = build();
        expect(manager.getStat('missing')).toBeUndefined();
    });

    it('returns the value of an existing stat and 0 for a missing one', () => {
        const manager = build();
        expect(manager.getStatValue('atk')).toBe(10);
        expect(manager.getStatValue('missing')).toBe(0);
    });

    it('adds a modifier to an existing stat', () => {
        const manager = build();
        manager.addModifier('atk', mod('m1', 'sword', 5));
        expect(manager.getStatValue('atk')).toBe(15);
    });

    it('ignores a modifier targeting a missing stat', () => {
        const manager = build();
        expect(() => manager.addModifier('missing', mod('m1', 'sword', 5))).not.toThrow();
    });

    it('removes modifiers from a given source across all stats', () => {
        const manager = build();
        manager.addModifier('hp', mod('h1', 'curse', -10));
        manager.addModifier('atk', mod('a1', 'curse', -2));
        manager.removeAllModifiersFromSource('curse');
        expect(manager.getStatValue('hp')).toBe(100);
        expect(manager.getStatValue('atk')).toBe(10);
    });

    it('exports the base values of every stat', () => {
        const manager = build();
        expect(manager.exportState()).toEqual({ hp: 100, atk: 10 });
    });

    it('imports base values, skipping unknown ids', () => {
        const manager = build();
        manager.addModifier('hp', mod('h1', 'buff', 25));
        manager.importState({ hp: 200, missing: 999 });
        expect(manager.getStat('hp')!.baseValue).toBe(200);
        // recalculation honours the new base value plus the existing modifier
        expect(manager.getStatValue('hp')).toBe(225);
        expect(manager.getStat('missing')).toBeUndefined();
    });
});
