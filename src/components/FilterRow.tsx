import React from "react";
import { filterContainerStyle, selectorStyle } from "../formatting/styleResolver";
import {
    allOptionKey,
    isAllSelected,
    resolveValueSelection,
    selectedValueKeys,
} from "../state/valueSelection";
import { normalizeBooleanSelection } from "../state/selectionState";
import type { AvailableField, AvailableValue } from "../types/data.types";
import type { FilterRowState } from "../types/filter.types";
import type {
    FilterFormattingValues,
    LegacyRowFormattingValues,
    VisualFormattingValues,
} from "../types/formatting.types";
import { FilterHeader } from "./FilterHeader";
import { Selector } from "./selectors/Selector";

interface FilterRowProps {
    readonly index: number;
    readonly row: FilterRowState;
    readonly fields: readonly AvailableField[];
    readonly assignedFieldIds: ReadonlySet<string>;
    readonly formatting: FilterFormattingValues;
    readonly legacyFormatting?: LegacyRowFormattingValues;
    readonly globalFormatting: VisualFormattingValues["dropdown"];
    readonly label: string;
    readonly onRemove: () => void;
    readonly onFieldChange: (fieldId: string | undefined) => void;
    readonly onValuesChange: (values: readonly AvailableValue[]) => void;
}

export function FilterRow({
    index,
    row,
    fields,
    assignedFieldIds,
    formatting,
    legacyFormatting,
    globalFormatting,
    label,
    onRemove,
    onFieldChange,
    onValuesChange,
}: FilterRowProps): React.JSX.Element {
    const field = fields.find((candidate) => candidate.id === row.fieldId);
    const booleanValues = field?.booleanValues;
    const selectedBooleanValues = field && booleanValues
        ? normalizeBooleanSelection(field, row.values)
        : [];
    const allKey = field ? allOptionKey(field.id) : undefined;
    const distinctValues: readonly AvailableValue[] = booleanValues
        ? [booleanValues.trueValue, booleanValues.falseValue]
        : field?.values ?? [];
    const currentValueOptions = distinctValues.map(({ key, label: optionLabel }) => ({
        key,
        label: optionLabel,
    }));
    const currentKeys = new Set(currentValueOptions.map((option) => option.key));
    const valueOptions = [
        ...(allKey ? [{ key: allKey, label: "All" }] : []),
        ...currentValueOptions,
        ...(!booleanValues
            ? row.values
                .filter((value) => !currentKeys.has(value.key))
                .map(({ key, label: optionLabel }) => ({ key, label: optionLabel }))
            : []),
    ];

    const handleValueChange = (keys: string[]): void => {
        const trueSelected = booleanValues && keys.includes(booleanValues.trueValue.key);
        const falseSelected = booleanValues && keys.includes(booleanValues.falseValue.key);
        if (isAllSelected(keys, allKey) || (trueSelected && falseSelected)) {
            onValuesChange([]);
            return;
        }
        const values = resolveValueSelection(keys, allKey, distinctValues, row.values);
        onValuesChange(field && booleanValues ? normalizeBooleanSelection(field, values) : values);
    };

    return (
        <article className="filter-row" style={filterContainerStyle(formatting)}>
            <FilterHeader
                index={index}
                label={label}
                formatting={formatting}
                legacyFormatting={legacyFormatting}
                onRemove={onRemove}
            />
            <Selector
                variant="field"
                presentation={formatting.filterType}
                style={selectorStyle(formatting, legacyFormatting, globalFormatting, "field")}
                options={fields
                    .filter((candidate) => candidate.id === field?.id || !assignedFieldIds.has(candidate.id))
                    .map((candidate) => ({ key: candidate.id, label: candidate.displayName }))}
                selected={field ? [field.id] : []}
                placeholder={fields.length ? "Choose a column..." : "Assign columns in Power BI..."}
                multiple={false}
                disabled={fields.length === 0}
                onChange={(keys) => onFieldChange(keys[0])}
            />
            <Selector
                variant="value"
                presentation={formatting.filterType}
                allOptionKey={allKey}
                style={selectorStyle(formatting, legacyFormatting, globalFormatting, "value")}
                options={valueOptions}
                selected={selectedValueKeys(
                    Boolean(field),
                    allKey,
                    booleanValues ? selectedBooleanValues : row.values,
                )}
                placeholder={field ? "All" : "Choose a column first..."}
                multiple={formatting.selectionMode === "multi"}
                disabled={!field}
                onChange={handleValueChange}
            />
        </article>
    );
}
