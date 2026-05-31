import { Stat } from './Stat';
import { IStatModifier } from '../interfaces/stats';

export class StatManager {
    private stats: Map<string, Stat> = new Map();

    public initialize(config: Record<string, number>): void {
        for (const [statId, baseValue] of Object.entries(config)) {
            this.stats.set(statId, new Stat(statId, statId.toUpperCase(), baseValue));
        }
    }

    public getStat(statId: string): Stat | undefined {
        return this.stats.get(statId);
    }

    public getStatValue(statId: string): number {
        const stat = this.stats.get(statId);
        return stat ? stat.value : 0;
    }

    public addModifier(statId: string, modifier: IStatModifier): void {
        const stat = this.stats.get(statId);
        if (stat) {
            stat.addModifier(modifier);
        }
    }

    public removeAllModifiersFromSource(source: string): void {
        this.stats.forEach(stat => {
            stat.removeModifiersBySource(source);
        });
    }

    public exportState(): Record<string, number> {
        const state: Record<string, number> = {};
        this.stats.forEach((stat, id) => {
            state[id] = stat.baseValue;
        });
        return state;
    }

    public importState(baseValues: Record<string, number>): void {
        for (const [id, value] of Object.entries(baseValues)) {
            const stat = this.stats.get(id);
            if (stat) {
                stat.baseValue = value;
                (stat as any)._isDirty = true;
            }
        }
    }
}
