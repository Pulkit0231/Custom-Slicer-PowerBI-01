import { INITIAL_FILTER_ROWS, MAX_FILTERS } from "../constants/filter.constants";
import { binaryBooleanValue, binarySelectionMeansAll } from "../data/booleanDetection";
import type { AvailableField, AvailableValue } from "../types/data.types";
import type { FilterRowState, FilterSelection } from "../types/filter.types";
import type { SelectionMode } from "../types/formatting.types";

export function createInitialRows(): FilterRowState[] {
    return Array.from({ length: INITIAL_FILTER_ROWS }, (_, index) => ({
        id: index + 1,
        values: [],
    }));
}

export function normalizeBooleanSelection(
    field: AvailableField,
    values: readonly AvailableValue[],
): readonly AvailableValue[] {
    const representation = field.binaryRepresentation;
    const booleanValues = field.booleanValues;
    if (!representation || !booleanValues || values.length === 0) return values;

    const logicalValues = values.map((value) => value.value == null
        ? null
        : binaryBooleanValue(value.value, representation));
    if (binarySelectionMeansAll(logicalValues)) return [];

    const selectedValues = new Set(logicalValues.filter((value): value is boolean => value !== undefined));
    if (selectedValues.size === 0) return [];

    const canonicalValue = selectedValues.has(true) ? booleanValues.trueValue : booleanValues.falseValue;
    return values.length === 1 && values[0]?.key === canonicalValue.key
        ? values
        : [canonicalValue];
}

export function reconcileRowsWithFields(
    rows: readonly FilterRowState[],
    fields: readonly AvailableField[],
    selectionModes: readonly SelectionMode[],
    seedInitialRows: boolean,
    hasDataView: boolean,
): FilterRowState[] {
    const fieldsById = new Map(fields.map((field) => [field.id, field]));
    if (fields.length > 0 && seedInitialRows) {
        return rows.map((row, index) => ({
            ...row,
            fieldId: fields[index]?.id,
            values: [],
        }));
    }
    if (fields.length === 0 && hasDataView) {
        return rows.map((row) => ({ ...row, fieldId: undefined, values: [] }));
    }

    const assignedFieldIds = new Set<string>();
    return rows.map((row, rowIndex) => {
        const field = row.fieldId ? fieldsById.get(row.fieldId) : undefined;
        if (row.fieldId && !field) return { ...row, fieldId: undefined, values: [] };
        if (!field) return row;
        if (assignedFieldIds.has(field.id)) return { ...row, fieldId: undefined, values: [] };
        assignedFieldIds.add(field.id);

        const values = selectionModes[rowIndex] === "multi" ? row.values : row.values.slice(0, 1);
        const normalizedValues = normalizeBooleanSelection(field, values);
        return normalizedValues === row.values ? row : { ...row, values: normalizedValues };
    });
}

export function selectionsFromRows(
    rows: readonly FilterRowState[],
    fields: readonly AvailableField[],
): FilterSelection[] {
    const fieldsById = new Map(fields.map((field) => [field.id, field]));
    return rows.flatMap((row): FilterSelection[] => {
        const field = row.fieldId ? fieldsById.get(row.fieldId) : undefined;
        return field && row.values.length > 0 ? [{ field, values: row.values }] : [];
    });
}

export function restoreRows(
    currentRows: readonly FilterRowState[],
    selections: readonly FilterSelection[],
    selectionModes: readonly SelectionMode[],
    nextRowId: () => number,
): { rows: FilterRowState[]; normalizedSelections: FilterSelection[]; booleanSelectionCleared: boolean } {
    const rowCount = Math.min(MAX_FILTERS, Math.max(currentRows.length, selections.length));
    const rows = Array.from({ length: rowCount }, (_, index): FilterRowState => {
        const existingRow = currentRows[index];
        return existingRow ? { ...existingRow, values: [] } : { id: nextRowId(), values: [] };
    });
    const usedRows = new Set<number>();
    let booleanSelectionCleared = false;

    const normalizedSelections = selections.slice(0, MAX_FILTERS).map((selection) => {
        const existingIndex = rows.findIndex((row, index) =>
            row.fieldId === selection.field.id && !usedRows.has(index));
        const rowIndex = existingIndex >= 0
            ? existingIndex
            : rows.findIndex((_, index) => !usedRows.has(index));
        if (rowIndex < 0) return selection;
        usedRows.add(rowIndex);

        const sourceValues = selectionModes[rowIndex] === "multi"
            ? selection.values
            : selection.values.slice(0, 1);
        const values = normalizeBooleanSelection(selection.field, sourceValues);
        if (sourceValues.length > 0 && values.length === 0 && selection.field.binaryRepresentation) {
            booleanSelectionCleared = true;
        }
        const targetRow = rows[rowIndex];
        if (!targetRow) return selection;
        rows[rowIndex] = { ...targetRow, fieldId: selection.field.id, values };
        return values === selection.values ? selection : { ...selection, values };
    });

    const assignedFields = new Set<string>();
    const uniqueRows = rows.map((row) => {
        if (!row.fieldId) return row;
        if (assignedFields.has(row.fieldId)) return { ...row, fieldId: undefined, values: [] };
        assignedFields.add(row.fieldId);
        return row;
    });
    return { rows: uniqueRows, normalizedSelections, booleanSelectionCleared };
}

export function updateRow(
    rows: readonly FilterRowState[],
    id: number,
    changes: Partial<FilterRowState>,
): FilterRowState[] {
    return rows.map((row) => row.id === id ? { ...row, ...changes } : row);
}
