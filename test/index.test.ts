import { describe, it, expect } from 'vitest';
import * as api from '../src/index';
import { ModifierType } from '../src/index';

describe('public API (index)', () => {
    it('re-exports the engine, managers and the event bus', () => {
        expect(api.CatalystEngine).toBeTypeOf('function');
        expect(api.StatManager).toBeTypeOf('function');
        expect(api.ExperienceManager).toBeTypeOf('function');
        expect(api.SkillManager).toBeTypeOf('function');
        expect(api.EngineEventBus).toBeTypeOf('function');
    });

    it('re-exports interface enums', () => {
        expect(ModifierType.FLAT).toBe('FLAT');
        expect(ModifierType.PERCENT).toBe('PERCENT');
    });
});
