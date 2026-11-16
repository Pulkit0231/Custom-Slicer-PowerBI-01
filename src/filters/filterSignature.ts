import type { FilterSelection } from "../types/filter.types";

export function filterSelectionSignature(selections: readonly FilterSelection[]): string {
    return JSON.stringify(selections
        .map(({ field, values }) => ({
            id: field.id,
            table: field.tableName,
            column: field.columnName,
            values: values.map((value) => value.key).sort(),
        }))
        .sort((left, right) => left.id.localeCompare(right.id)));
}
