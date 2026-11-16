import powerbi from "powerbi-visuals-api";
import type { AvailableField, AvailableValue } from "../types/data.types";
import type { FilterSelection } from "../types/filter.types";
import { binaryBooleanValue } from "./booleanDetection";
import { valueKey, valueLabel } from "./valueIdentity";

interface JsonFilterCandidate {
    readonly target?: { readonly table?: unknown; readonly column?: unknown };
    readonly values?: readonly unknown[];
    readonly conditions?: readonly { readonly operator?: unknown; readonly value?: unknown }[];
}

function isFilterPrimitive(value: unknown): value is powerbi.PrimitiveValue {
    return typeof value === "string"
        || typeof value === "number"
        || typeof value === "boolean"
        || value instanceof Date;
}

function filterValues(candidate: JsonFilterCandidate): Array<powerbi.PrimitiveValue | null> {
    if (Array.isArray(candidate.values)) {
        return candidate.values.flatMap((value) => value == null
            ? [null]
            : isFilterPrimitive(value) ? [value] : []);
    }
    if (!Array.isArray(candidate.conditions)) return [];
    return candidate.conditions.flatMap((condition) => {
        if (condition.operator === "IsBlank") return [null];
        if (condition.operator === "Is" && isFilterPrimitive(condition.value)) return [condition.value];
        return [];
    });
}

function restoreValue(field: AvailableField, rawValue: powerbi.PrimitiveValue | null): AvailableValue {
    let value = rawValue;
    if (field.dataType === "dateTime" && typeof rawValue === "string") {
        const parsedDate = new Date(rawValue);
        if (!Number.isNaN(parsedDate.getTime())) value = parsedDate;
    }

    const logicalValue = field.binaryRepresentation
        ? binaryBooleanValue(value, field.binaryRepresentation)
        : undefined;
    if (logicalValue !== undefined && field.booleanValues) {
        return logicalValue ? field.booleanValues.trueValue : field.booleanValues.falseValue;
    }

    const key = valueKey(value);
    return field.values.find((candidate) => candidate.key === key) ?? {
        key,
        label: valueLabel(value),
        value,
    };
}

export function restoreFilterSelections(
    jsonFilters: readonly powerbi.IFilter[] | undefined,
    fields: readonly AvailableField[],
): FilterSelection[] | undefined {
    if (!jsonFilters) return undefined;

    const selectionsByFieldId = new Map<string, FilterSelection>();
    for (const jsonFilter of jsonFilters) {
        const candidate = jsonFilter as JsonFilterCandidate;
        const table = candidate.target?.table;
        const column = candidate.target?.column;
        if (typeof table !== "string" || typeof column !== "string") continue;

        const field = fields.find((item) => item.tableName === table && item.columnName === column);
        if (!field) continue;

        const values = filterValues(candidate).map((value) => restoreValue(field, value));
        if (values.length > 0) selectionsByFieldId.set(field.id, { field, values });
    }
    return [...selectionsByFieldId.values()];
}
