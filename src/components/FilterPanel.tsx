import React, { useEffect, useRef, useState } from "react";
import { MAX_FILTERS } from "../constants/filter.constants";
import { filterSelectionSignature } from "../filters/filterSignature";
import { globalSelectorStyle } from "../formatting/styleResolver";
import {
    createInitialRows,
    reconcileRowsWithFields,
    restoreRows,
    selectionsFromRows,
    updateRow,
} from "../state/selectionState";
import type { AvailableField, AvailableValue } from "../types/data.types";
import type { FilterRowState, FilterSelection } from "../types/filter.types";
import type { SelectionMode, VisualFormattingValues } from "../types/formatting.types";
import { FilterRow } from "./FilterRow";
import "../styles/visual.css";

interface FilterPanelProps {
    readonly fields: readonly AvailableField[];
    readonly hasDataView: boolean;
    readonly formatting: VisualFormattingValues;
    readonly restoredSelections?: readonly FilterSelection[];
    readonly onFiltersChange: (selections: readonly FilterSelection[]) => boolean;
}

export function FilterPanel({
    fields,
    hasDataView,
    formatting,
    restoredSelections,
    onFiltersChange,
}: FilterPanelProps): React.JSX.Element {
    const [rows, setRows] = useState<FilterRowState[]>(createInitialRows);
    const rowsRef = useRef<readonly FilterRowState[]>(rows);
    rowsRef.current = rows;
    const initialRowsSeeded = useRef(false);
    const nextRowId = useRef(5);
    const activeFilterSignature = useRef("[]");
    const lastHostFilterSignature = useRef<string | undefined>(undefined);
    const forceFilterSync = useRef(false);
    const skipNextFilterSync = useRef(false);
    const selectionModes: readonly SelectionMode[] = formatting.filters.map((filter) => filter.selectionMode);

    useEffect(() => {
        setRows((currentRows) => {
            let changed = false;
            const nextRows = currentRows.map((row, index) => {
                if (selectionModes[index] === "multi" || row.values.length <= 1) return row;
                changed = true;
                return { ...row, values: row.values.slice(0, 1) };
            });
            return changed ? nextRows : currentRows;
        });
    }, [formatting.filters]);

    useEffect(() => {
        setRows((currentRows) => {
            const shouldSeed = fields.length > 0 && !initialRowsSeeded.current;
            if (shouldSeed) initialRowsSeeded.current = true;
            return reconcileRowsWithFields(
                currentRows,
                fields,
                selectionModes,
                shouldSeed,
                hasDataView,
            );
        });
    }, [fields, hasDataView]);

    useEffect(() => {
        if (!restoredSelections) return;
        const hostSignature = filterSelectionSignature(restoredSelections);
        const restored = restoreRows(
            rowsRef.current,
            restoredSelections,
            selectionModes,
            () => nextRowId.current++,
        );
        const normalizedSignature = filterSelectionSignature(restored.normalizedSelections);
        const hostNeedsNormalization = normalizedSignature !== hostSignature;
        if (hostSignature === lastHostFilterSignature.current
            && !hostNeedsNormalization
            && normalizedSignature === activeFilterSignature.current) return;

        lastHostFilterSignature.current = hostSignature;
        if (!hostNeedsNormalization && normalizedSignature === activeFilterSignature.current) return;

        activeFilterSignature.current = hostNeedsNormalization ? hostSignature : normalizedSignature;
        forceFilterSync.current = restored.booleanSelectionCleared;
        skipNextFilterSync.current = !restored.booleanSelectionCleared;
        setRows(restored.rows);
    }, [restoredSelections, formatting.filters]);

    useEffect(() => {
        if (skipNextFilterSync.current) {
            skipNextFilterSync.current = false;
            return;
        }
        const selections = selectionsFromRows(rows, fields);
        const signature = filterSelectionSignature(selections);
        if (!forceFilterSync.current && signature === activeFilterSignature.current) return;
        if (!onFiltersChange(selections)) return;

        forceFilterSync.current = false;
        activeFilterSignature.current = signature;
    }, [rows, fields, formatting.filters, onFiltersChange]);

    const addFilter = (): void => {
        setRows((currentRows) => currentRows.length >= MAX_FILTERS
            ? currentRows
            : [...currentRows, { id: nextRowId.current++, values: [] }]);
    };

    const removeFilter = (id: number): void => {
        if (rows.length === 1) forceFilterSync.current = true;
        setRows((currentRows) => currentRows.filter((row) => row.id !== id));
    };

    const changeField = (id: number, fieldId: string | undefined): void => {
        setRows((currentRows) => {
            if (fieldId && currentRows.some((row) => row.id !== id && row.fieldId === fieldId)) {
                return currentRows;
            }
            return updateRow(currentRows, id, { fieldId, values: [] });
        });
    };

    const changeValues = (id: number, values: readonly AvailableValue[]): void => {
        setRows((currentRows) => updateRow(currentRows, id, { values }));
    };

    const assignedFieldIds = new Set(rows.flatMap((row) => row.fieldId ? [row.fieldId] : []));

    return (
        <main className="filter-panel" style={globalSelectorStyle(formatting)}>
            <section className="filter-list">
                {rows.map((row, index) => {
                    const filterFormatting = formatting.filters[index];
                    if (!filterFormatting) return null;
                    const label = filterFormatting.customName
                        || formatting.labels[index]?.trim()
                        || `Filter ${index + 1}`;
                    return (
                        <FilterRow
                            key={row.id}
                            index={index}
                            row={row}
                            fields={fields}
                            assignedFieldIds={assignedFieldIds}
                            formatting={filterFormatting}
                            legacyFormatting={formatting.rows[index]}
                            globalFormatting={formatting.dropdown}
                            label={label}
                            onRemove={() => removeFilter(row.id)}
                            onFieldChange={(fieldId) => changeField(row.id, fieldId)}
                            onValuesChange={(values) => changeValues(row.id, values)}
                        />
                    );
                })}
            </section>
            <button type="button" className="add-button" onClick={addFilter} disabled={rows.length >= MAX_FILTERS}>
                <span>＋</span> Add another column filter
                <span className="count">{rows.length}/{MAX_FILTERS}</span>
            </button>
        </main>
    );
}
