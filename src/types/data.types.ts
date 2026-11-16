import powerbi from "powerbi-visuals-api";
import type { BinaryRepresentation } from "../data/booleanDetection";

export interface AvailableValue {
    readonly key: string;
    readonly label: string;
    readonly value: powerbi.PrimitiveValue | null;
    readonly filterValues?: readonly powerbi.PrimitiveValue[];
}

export interface BooleanChoices {
    readonly trueValue: AvailableValue;
    readonly falseValue: AvailableValue;
}

export interface AvailableField {
    readonly id: string;
    readonly role: string;
    readonly displayName: string;
    readonly queryName?: string;
    readonly tableName?: string;
    readonly columnName?: string;
    readonly dataType?: string;
    readonly binaryRepresentation?: BinaryRepresentation;
    readonly booleanValues?: BooleanChoices;
    readonly values: readonly AvailableValue[];
}
