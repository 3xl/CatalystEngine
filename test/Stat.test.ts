import { describe, it, expect } from 'vitest';
import { Stat } from '../src/core/Stat';
import { ModifierType, IStatModifier } from '../src/interfaces/stats';

const flat = (id: string, source: string, value: number): IStatModifier => ({
    id,
    source,
    type: ModifierType.FLAT,
    value,
});

const percent = (id: string, source: string, value: number): IStatModifier => ({
    id,
    source,
    type: ModifierType.PERCENT,
    value,
});

describe('Stat', () => {
    it('stores the constructor arguments', () => {
        const stat = new Stat('hp', 'HP', 100);
        expect(stat.id).toBe('hp');
        expect(stat.name).toBe('HP');
        expect(stat.baseValue).toBe(100);
        expect(stat.modifiers).toEqual([]);
    });

    it('returns the base value when there are no modifiers', () => {
        const stat = new Stat('hp', 'HP', 100);
        expect(stat.value).toBe(100);
    });

    it('caches the computed value until a modifier changes (dirty flag)', () => {
        const stat = new Stat('hp', 'HP', 100);
        // First access recalculates, second uses the cached value.
        expect(stat.value).toBe(100);
        expect(stat.value).toBe(100);

        stat.addModifier(flat('m1', 'buff', 50));
        expect(stat.value).toBe(150);
    });

    it('applies FLAT modifiers additively', () => {
        const stat = new Stat('atk', 'ATK', 10);
        stat.addModifier(flat('m1', 'sword', 5));
        stat.addModifier(flat('m2', 'ring', 3));
        expect(stat.value).toBe(18);
    });

    it('applies PERCENT modifiers as a multiplier on top of flats', () => {
        const stat = new Stat('atk', 'ATK', 100);
        stat.addModifier(flat('m1', 'sword', 50)); // 150
        stat.addModifier(percent('m2', 'rage', 0.2)); // 150 * 1.2 = 180
        expect(stat.value).toBe(180);
    });

    it('rounds the final value', () => {
        const stat = new Stat('atk', 'ATK', 10);
        stat.addModifier(percent('m1', 'rage', 0.15)); // 11.5 -> 12
        expect(stat.value).toBe(12);
    });

    it('removes a modifier by id', () => {
        const stat = new Stat('atk', 'ATK', 10);
        stat.addModifier(flat('m1', 'sword', 5));
        stat.addModifier(flat('m2', 'ring', 3));
        stat.removeModifier('m1');
        expect(stat.modifiers.map(m => m.id)).toEqual(['m2']);
        expect(stat.value).toBe(13);
    });

    it('ignores a modifier with an unrecognized type', () => {
        const stat = new Stat('atk', 'ATK', 10);
        stat.addModifier(flat('m1', 'sword', 5));
        stat.addModifier({ id: 'm2', source: 'glitch', type: 'UNKNOWN' as any, value: 999 });
        expect(stat.value).toBe(15);
    });

    it('removes every modifier sharing a source', () => {
        const stat = new Stat('atk', 'ATK', 10);
        stat.addModifier(flat('m1', 'sword', 5));
        stat.addModifier(percent('m2', 'sword', 0.5));
        stat.addModifier(flat('m3', 'ring', 2));
        stat.removeModifiersBySource('sword');
        expect(stat.modifiers.map(m => m.id)).toEqual(['m3']);
        expect(stat.value).toBe(12);
    });
});
