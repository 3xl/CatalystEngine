import { describe, it, expect, vi } from 'vitest';
import { EngineEventBus } from '../src/core/EngineEventBus';

describe('EngineEventBus', () => {
    it('registers and invokes a listener', () => {
        const bus = new EngineEventBus();
        const listener = vi.fn();
        bus.on('XP_GAINED', listener);
        bus.emit('XP_GAINED', { currentXP: 10, nextRequiredXP: 100, percentage: 0.1 });
        expect(listener).toHaveBeenCalledWith({ currentXP: 10, nextRequiredXP: 100, percentage: 0.1 });
    });

    it('supports multiple listeners on the same event', () => {
        const bus = new EngineEventBus();
        const a = vi.fn();
        const b = vi.fn();
        bus.on('LEVEL_UP', a);
        bus.on('LEVEL_UP', b);
        bus.emit('LEVEL_UP', { currentLevel: 2, levelsGained: 1, excessXP: 0 });
        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
    });

    it('does nothing when emitting an event with no listeners', () => {
        const bus = new EngineEventBus();
        expect(() => bus.emit('STAT_CHANGED', { statId: 'hp', newValue: 1, baseValue: 1 })).not.toThrow();
    });

    it('removes a listener with off', () => {
        const bus = new EngineEventBus();
        const a = vi.fn();
        const b = vi.fn();
        bus.on('STAT_CHANGED', a);
        bus.on('STAT_CHANGED', b);
        bus.off('STAT_CHANGED', a);
        bus.emit('STAT_CHANGED', { statId: 'hp', newValue: 1, baseValue: 1 });
        expect(a).not.toHaveBeenCalled();
        expect(b).toHaveBeenCalledTimes(1);
    });

    it('off is a no-op when the event has no listeners', () => {
        const bus = new EngineEventBus();
        expect(() => bus.off('XP_GAINED', vi.fn())).not.toThrow();
    });
});
