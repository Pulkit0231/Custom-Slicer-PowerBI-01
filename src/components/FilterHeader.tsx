import React from "react";
import { headingStyle, titleStyle } from "../formatting/styleResolver";
import type { FilterFormattingValues, LegacyRowFormattingValues } from "../types/formatting.types";

interface FilterHeaderProps {
    readonly index: number;
    readonly label: string;
    readonly formatting: FilterFormattingValues;
    readonly legacyFormatting?: LegacyRowFormattingValues;
    readonly onRemove: () => void;
}

export function FilterHeader({
    index,
    label,
    formatting,
    legacyFormatting,
    onRemove,
}: FilterHeaderProps): React.JSX.Element {
    return (
        <>
            {formatting.slicer.title.show && (
                <div className="slicer-title" style={titleStyle(formatting)}>
                    {formatting.slicer.title.text || label}
                </div>
            )}
            <div className="row-heading">
                <label
                    className="row-label"
                    aria-hidden={!formatting.showFilterName}
                    style={headingStyle(formatting, legacyFormatting)}
                >
                    {label}
                </label>
                <button
                    type="button"
                    className="remove-button"
                    onClick={onRemove}
                    aria-label={`Remove filter ${index + 1}`}
                    title="Remove filter"
                >
                    ×
                </button>
            </div>
        </>
    );
}
