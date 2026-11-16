import powerbi from "powerbi-visuals-api";
import { MAX_FILTERS } from "../constants/filter.constants";
import type { FilterType } from "../types/formatting.types";

function enumValue(value: unknown): string | undefined {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "value" in value) {
        const memberValue = value.value;
        return typeof memberValue === "string" ? memberValue : undefined;
    }
    return undefined;
}

function isFilterType(value: string | undefined): value is FilterType {
    return value === "dropdown" || value === "list" || value === "button" || value === "option";
}

export function readLegacyFilterTypes(dataView: powerbi.DataView): Array<FilterType | undefined> {
    const objects: Record<string, unknown> | undefined = dataView.metadata.objects;
    return Array.from({ length: MAX_FILTERS }, (_, index) => {
        const filterObject = objects?.[`filter${index + 1}`];
        if (!filterObject || typeof filterObject !== "object") return undefined;
        const properties = filterObject as Record<string, unknown>;
        if (isFilterType(enumValue(properties.filterType))) return undefined;

        const legacyValueType = enumValue(properties.valueSlicerType);
        if (isFilterType(legacyValueType)) return legacyValueType;
        const legacyFieldType = enumValue(properties.fieldSlicerType);
        return isFilterType(legacyFieldType) ? legacyFieldType : undefined;
    });
}
