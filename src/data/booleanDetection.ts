export type BinaryRepresentation = "boolean" | "numeric" | "numericString" | "booleanString";

export function isBinaryDomainComplete(
    rowCount: number,
    rowLimit: number,
    hasSegment: boolean,
    hasReduction: boolean,
): boolean {
    return rowCount < rowLimit && !hasSegment && !hasReduction;
}

export function binarySelectionMeansAll(values: readonly (boolean | null | undefined)[]): boolean {
    return values.some((value) => value == null)
        || (values.includes(true) && values.includes(false));
}

export function isLikelyIdentifierField(displayName: string, queryName?: string): boolean {
    const fieldName = (queryName?.split(".").at(-1) || displayName)
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase();
    return /(^|[\s_.-])(id|identifier|key|code|number|no)($|[\s_.-])/.test(fieldName);
}

export function detectBinaryRepresentation(
    dataType: string | undefined,
    values: readonly unknown[],
    domainIsComplete: boolean,
): BinaryRepresentation | undefined {
    if (dataType === "boolean") return "boolean";
    if (!domainIsComplete) return undefined;

    const nonBlankValues = values.filter((value) => value !== null && value !== undefined);
    if (nonBlankValues.length === 0) return undefined;

    if (dataType === "numeric" || dataType === "integer") {
        return nonBlankValues.every((value) => typeof value === "number" && (value === 0 || value === 1))
            ? "numeric"
            : undefined;
    }

    if (dataType !== "text" || !nonBlankValues.every((value) => typeof value === "string")) return undefined;

    if (nonBlankValues.every((value) => value === "0" || value === "1")) return "numericString";
    if (nonBlankValues.every((value) => {
        const normalized = value.toLowerCase();
        return normalized === "true" || normalized === "false";
    })) return "booleanString";

    return undefined;
}

export function binaryBooleanValue(value: unknown, representation: BinaryRepresentation): boolean | undefined {
    switch (representation) {
        case "boolean":
            return typeof value === "boolean" ? value : undefined;
        case "numeric":
            return typeof value === "number" && (value === 0 || value === 1) ? value === 1 : undefined;
        case "numericString":
            return value === "0" || value === "1" ? value === "1" : undefined;
        case "booleanString":
            if (typeof value !== "string") return undefined;
            if (value.toLowerCase() === "true") return true;
            if (value.toLowerCase() === "false") return false;
            return undefined;
    }
}

export function binarySourceValue(
    representation: BinaryRepresentation,
    booleanValue: boolean,
): boolean | number | string {
    switch (representation) {
        case "boolean": return booleanValue;
        case "numeric": return booleanValue ? 1 : 0;
        case "numericString": return booleanValue ? "1" : "0";
        case "booleanString": return booleanValue ? "true" : "false";
    }
}

export function binaryFilterValues(
    values: readonly unknown[],
    representation: BinaryRepresentation,
    booleanValue: boolean,
): Array<boolean | number | string> {
    const matches = values.filter((value) => binaryBooleanValue(value, representation) === booleanValue);
    const typedMatches = matches.filter((value): value is boolean | number | string =>
        typeof value === "boolean" || typeof value === "number" || typeof value === "string");
    return typedMatches.length > 0 ? typedMatches : [binarySourceValue(representation, booleanValue)];
}
