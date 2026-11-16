import powerbi from "powerbi-visuals-api";

export function valueKey(value: powerbi.PrimitiveValue | null | undefined): string {
    if (value == null) return "blank:";
    if (value instanceof Date) return `date:${value.getTime()}`;
    switch (typeof value) {
        case "string": return `string:${value}`;
        case "number": return `number:${Object.is(value, -0) ? "-0" : String(value)}`;
        case "boolean": return `boolean:${value}`;
    }
}

export function valueLabel(value: powerbi.PrimitiveValue | null | undefined): string {
    if (value == null) return "(Blank)";
    if (value === "") return "(Empty text)";
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === "number") return value.toLocaleString();
    return String(value);
}

export function toFilterScalar(value: powerbi.PrimitiveValue | null): string | number | boolean | null {
    if (value == null) return null;
    if (value instanceof Date) return value.toISOString();
    return value;
}
