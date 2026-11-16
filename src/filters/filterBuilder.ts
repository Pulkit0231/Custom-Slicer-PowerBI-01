import type { FilterSelection, FilterScalar, VisualJsonFilter } from "../types/filter.types";
import { toFilterScalar, valueKey } from "../data/valueIdentity";

function uniqueFilterValues(selection: FilterSelection): Array<FilterScalar | null> {
    const valuesByKey = new Map<string, FilterScalar | null>();
    for (const selectedValue of selection.values) {
        const sourceValues = selectedValue.filterValues?.length
            ? selectedValue.filterValues
            : [selectedValue.value];
        for (const sourceValue of sourceValues) {
            const filterValue = toFilterScalar(sourceValue);
            valuesByKey.set(valueKey(filterValue), filterValue);
        }
    }
    return [...valuesByKey.values()];
}

export function buildJsonFilter(selection: FilterSelection): VisualJsonFilter | undefined {
    const { tableName, columnName } = selection.field;
    if (!tableName || !columnName || selection.values.length === 0) return undefined;

    const values = uniqueFilterValues(selection);
    const target = { table: tableName, column: columnName };
    if (values.some((value) => value === null)) {
        return {
            // Power BI defines this filter schema with HTTP; changing it would make the filter invalid.
            // eslint-disable-next-line powerbi-visuals/no-http-string
            $schema: "http://powerbi.com/product/schema#advanced",
            target,
            logicalOperator: "Or",
            conditions: values.map((value) => value === null
                ? { operator: "IsBlank" as const }
                : { operator: "Is" as const, value }),
        };
    }
    return {
        // Power BI defines this filter schema with HTTP; changing it would make the filter invalid.
        // eslint-disable-next-line powerbi-visuals/no-http-string
        $schema: "http://powerbi.com/product/schema#basic",
        target,
        operator: "In",
        values: values.filter((value): value is FilterScalar => value !== null),
    };
}

export function buildJsonFilters(selections: readonly FilterSelection[]): VisualJsonFilter[] | undefined {
    const filters = selections.flatMap((selection) => {
        const filter = buildJsonFilter(selection);
        return filter ? [filter] : [];
    });
    return filters.length === selections.length ? filters : undefined;
}
