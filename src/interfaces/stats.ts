export enum ModifierType {
    FLAT = 'FLAT',
    PERCENT = 'PERCENT'
}

export interface IStatModifier {
    id: string;
    source: string;
    type: ModifierType;
    value: number;
}

export interface IStat {
    id: string;
    name: string;
    baseValue: number;
    modifiers: ReadonlyArray<IStatModifier>;
    readonly value: number;
}
