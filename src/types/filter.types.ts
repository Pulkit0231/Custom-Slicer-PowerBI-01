import type { AvailableField, AvailableValue } from "./data.types";

export type FilterScalar = string | number | boolean;

export interface FilterSelection {
    readonly field: AvailableField;
    readonly values: readonly AvailableValue[];
}

export interface FilterRowState {
    readonly id: number;
    readonly fieldId?: string;
    readonly values: readonly AvailableValue[];
}

export interface BasicJsonFilter {
    readonly $schema: string;
    readonly target: FilterTarget;
    readonly operator: "In";
    readonly values: readonly FilterScalar[];
}

export interface AdvancedJsonFilter {
    readonly $schema: string;
    readonly target: FilterTarget;
    readonly logicalOperator: "Or";
    readonly conditions: readonly AdvancedFilterCondition[];
}

export interface FilterTarget {
    readonly table: string;
    readonly column: string;
}

export type AdvancedFilterCondition =
    | { readonly operator: "IsBlank" }
    | { readonly operator: "Is"; readonly value: FilterScalar };

export type VisualJsonFilter = BasicJsonFilter | AdvancedJsonFilter;
