import { IStat, IStatModifier, ModifierType } from '../interfaces/stats';

export class Stat implements IStat {
    public readonly id: string;
    public name: string;
    public baseValue: number;

    private _modifiers: IStatModifier[] = [];
    private _finalValue: number = 0;
    private _isDirty: boolean = true;

    constructor(id: string, name: string, baseValue: number) {
        this.id = id;
        this.name = name;
        this.baseValue = baseValue;
    }

    public get modifiers(): ReadonlyArray<IStatModifier> {
        return this._modifiers;
    }

    public get value(): number {
        if (this._isDirty) {
            this.recalculate();
        }
        return this._finalValue;
    }

    public addModifier(modifier: IStatModifier): void {
        this._modifiers.push(modifier);
        this._isDirty = true;
    }

    public removeModifier(modifierId: string): void {
        this._modifiers = this._modifiers.filter(m => m.id !== modifierId);
        this._isDirty = true;
    }

    public removeModifiersBySource(source: string): void {
        this._modifiers = this._modifiers.filter(m => m.source !== source);
        this._isDirty = true;
    }

    private recalculate(): void {
        let finalValue = this.baseValue;
        let percentMultiplier = 0;

        for (const mod of this._modifiers) {
            if (mod.type === ModifierType.FLAT) {
                finalValue += mod.value;
            } else if (mod.type === ModifierType.PERCENT) {
                percentMultiplier += mod.value;
            }
        }

        if (percentMultiplier !== 0) {
            finalValue *= (1 + percentMultiplier);
        }

        this._finalValue = Math.round(finalValue);
        this._isDirty = false;
    }
}
