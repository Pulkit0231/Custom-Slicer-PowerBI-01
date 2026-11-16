import React, { useState } from "react";
import { nextValueSelectorKeys } from "../../state/valueSelection";
import type { FilterType } from "../../types/formatting.types";

export interface SelectorOption {
    readonly key: string;
    readonly label: string;
}

interface SelectorProps {
    readonly options: readonly SelectorOption[];
    readonly selected: readonly string[];
    readonly placeholder: string;
    readonly multiple: boolean;
    readonly variant: "field" | "value";
    readonly presentation: FilterType;
    readonly allOptionKey?: string;
    readonly disabled?: boolean;
    readonly style?: React.CSSProperties;
    readonly onChange: (keys: string[]) => void;
}

export function Selector({
    options,
    selected,
    placeholder,
    multiple,
    variant,
    presentation,
    allOptionKey,
    disabled = false,
    style,
    onChange,
}: SelectorProps): React.JSX.Element {
    const [open, setOpen] = useState(false);
    const selectedLabels = selected.flatMap((key) => {
        const option = options.find((candidate) => candidate.key === key);
        return option ? [option.label] : [];
    });
    const label = selectedLabels.length === 0
        ? placeholder
        : selectedLabels.length === 1
            ? selectedLabels[0]
            : `${selectedLabels.length} selected`;

    const choose = (key: string): void => {
        const nextSelection = nextValueSelectorKeys(key, selected, multiple, allOptionKey);
        if (!nextSelection) return;
        onChange(nextSelection);
        if (!multiple) setOpen(false);
    };

    if (presentation !== "dropdown") {
        const containerClass = presentation === "button"
            ? "selector-buttons"
            : presentation === "option" ? "selector-options" : "selector-list";
        const role = presentation === "option" && !multiple
            ? "radiogroup"
            : multiple ? "group" : "listbox";
        const showIndicator = presentation === "option" || (presentation === "list" && multiple);
        return (
            <div className={`dropdown ${variant}-dropdown ${containerClass}`} style={style} role={role} aria-multiselectable={multiple}>
                {options.length === 0 ? (
                    <span className="dropdown-empty">{disabled ? placeholder : "No values available"}</span>
                ) : options.map((option) => {
                    const isSelected = selected.includes(option.key);
                    return (
                        <button
                            type="button"
                            key={option.key}
                            className={`dropdown-option ${presentation}-option ${isSelected ? "selected" : ""}`}
                            onClick={() => choose(option.key)}
                            disabled={disabled}
                            role={presentation === "list" ? "option" : presentation === "option" ? (multiple ? "checkbox" : "radio") : undefined}
                            aria-pressed={isSelected}
                            aria-checked={isSelected}
                            aria-selected={isSelected}
                        >
                            {showIndicator && (
                                <span className={`option-checkbox ${multiple ? "multi" : "single"} ${presentation === "option" && !multiple ? "radio" : ""} ${isSelected ? "checked" : ""}`} aria-hidden="true">
                                    {isSelected && (multiple || presentation !== "option") ? "✓" : ""}
                                </span>
                            )}
                            <span>{option.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`dropdown ${variant}-dropdown`} style={style}>
            <button
                type="button"
                className="dropdown-trigger"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                disabled={disabled}
            >
                <span className="dropdown-label">{label}</span>
                <span className={`chevron ${open ? "rotated" : ""}`} aria-hidden="true">▾</span>
            </button>
            {open && !disabled && (
                <div className="dropdown-menu" role="listbox" aria-multiselectable={multiple}>
                    {options.length === 0 ? (
                        <span className="dropdown-empty">No values available</span>
                    ) : options.map((option) => {
                        const isSelected = selected.includes(option.key);
                        return (
                            <button
                                type="button"
                                key={option.key}
                                className={`dropdown-option ${isSelected ? "selected" : ""}`}
                                onClick={() => choose(option.key)}
                                aria-pressed={isSelected}
                            >
                                <span className={`option-checkbox ${multiple ? "multi" : "single"} ${isSelected ? "checked" : ""}`} aria-hidden="true">
                                    {isSelected ? "✓" : ""}
                                </span>
                                <span>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
