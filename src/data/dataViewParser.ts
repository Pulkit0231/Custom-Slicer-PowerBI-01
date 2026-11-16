import powerbi from "powerbi-visuals-api";
import { FIELD_ROLES, MAX_TABLE_ROWS } from "../constants/filter.constants";
import type { AvailableField, AvailableValue } from "../types/data.types";
import {
    binaryBooleanValue,
    binaryFilterValues,
    detectBinaryRepresentation,
    isLikelyIdentifierField,
    isBinaryDomainComplete,
} from "./booleanDetection";
import type { BinaryRepresentation } from "./booleanDetection";
import { valueKey, valueLabel } from "./valueIdentity";

function getDataType(column: powerbi.DataViewMetadataColumn): string | undefined {
    const type = column.type;
    if (!type) return undefined;
    if (type.dateTime) return "dateTime";
    if (type.bool) return "boolean";
    if (type.integer) return "integer";
    if (type.numeric) return "numeric";
    if (type.text) return "text";
    if (type.duration) return "duration";
    return "scalar";
}

function getRole(column: powerbi.DataViewMetadataColumn, columnIndex: number): string | undefined {
    return FIELD_ROLES.find((role) => column.roles?.[role]) ?? FIELD_ROLES[columnIndex];
}

export function parseQueryName(
    queryName: string | undefined,
    fallbackColumnName: string,
): { tableName?: string; columnName: string } {
    if (!queryName) return { columnName: fallbackColumnName };
    const separatorIndex = queryName.indexOf(".");
    if (separatorIndex <= 0 || separatorIndex === queryName.length - 1) {
        return { columnName: fallbackColumnName };
    }
    return {
        tableName: queryName.slice(0, separatorIndex),
        columnName: queryName.slice(separatorIndex + 1),
    };
}

function createBooleanChoice(
    domainValues: readonly AvailableValue[],
    representation: BinaryRepresentation,
    logicalValue: boolean,
): AvailableValue {
    const filterValues = binaryFilterValues(
        domainValues.map((value) => value.value),
        representation,
        logicalValue,
    );
    return {
        key: `binary:${logicalValue}`,
        label: logicalValue ? "True" : "False",
        value: filterValues[0] ?? null,
        filterValues,
    };
}

function distinctValues(rows: readonly powerbi.DataViewTableRow[], columnIndex: number): AvailableValue[] {
    const valuesByKey = new Map<string, AvailableValue>();
    for (const row of rows) {
        const rawValue = row[columnIndex];
        const key = valueKey(rawValue);
        if (!valuesByKey.has(key)) {
            valuesByKey.set(key, {
                key,
                label: valueLabel(rawValue),
                value: rawValue ?? null,
            });
        }
    }
    return [...valuesByKey.values()];
}

export function parseDataView(dataView: powerbi.DataView | undefined): AvailableField[] {
    if (!dataView) return [];
    const table = dataView.table;
    if (!table?.columns?.length) return [];

    const rows = table.rows ?? [];
    const completeDomain = isBinaryDomainComplete(
        rows.length,
        MAX_TABLE_ROWS,
        dataView.metadata.segment != null,
        dataView.metadata.dataReduction != null,
    );

    return table.columns.flatMap((column, columnIndex): AvailableField[] => {
        const role = getRole(column, columnIndex);
        if (!role) return [];

        const queryName = column.queryName;
        const target = parseQueryName(queryName, column.displayName);
        const dataType = getDataType(column);
        const domainValues = distinctValues(rows, columnIndex);
        const binaryRepresentation = dataType !== "boolean" && isLikelyIdentifierField(column.displayName, queryName)
            ? undefined
            : detectBinaryRepresentation(
                dataType,
                domainValues.map((value) => value.value),
                completeDomain,
            );
        const booleanValues = binaryRepresentation
            ? {
                trueValue: createBooleanChoice(domainValues, binaryRepresentation, true),
                falseValue: createBooleanChoice(domainValues, binaryRepresentation, false),
            }
            : undefined;
        const values = binaryRepresentation
            ? domainValues.map((value): AvailableValue => {
                const logicalValue = binaryBooleanValue(value.value, binaryRepresentation);
                return logicalValue === undefined
                    ? value
                    : { ...value, label: logicalValue ? "True" : "False" };
            })
            : domainValues;

        return [{
            id: `${role}:${queryName ?? columnIndex}`,
            role,
            displayName: column.displayName || role,
            queryName,
            ...target,
            dataType,
            binaryRepresentation,
            booleanValues,
            values,
        }];
    });
}
