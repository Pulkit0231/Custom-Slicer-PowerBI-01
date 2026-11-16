import type React from "react";
import type {
    DropdownFormattingValues,
    FilterFormattingValues,
    LegacyRowFormattingValues,
    VisualFormattingValues,
} from "../types/formatting.types";

type CssVariableName = `--${string}`;
export type VisualStyle = React.CSSProperties & Partial<Record<CssVariableName, string | number>>;

export function globalSelectorStyle(formatting: VisualFormattingValues): VisualStyle {
    return {
        "--dropdown-bg": formatting.dropdown.backgroundColor,
        "--dropdown-color": formatting.dropdown.textColor,
        "--dropdown-border": formatting.dropdown.borderColor,
        "--dropdown-icon": formatting.dropdown.iconColor,
        "--dropdown-selected-bg": formatting.dropdown.selectionBackgroundColor,
        "--dropdown-selected-color": formatting.dropdown.selectionTextColor,
    };
}

export function filterContainerStyle(formatting: FilterFormattingValues): VisualStyle {
    const slicer = formatting.slicer;
    return {
        ...(slicer.backgroundEnabled && slicer.backgroundColor
            ? { "--filter-row-background": `color-mix(in srgb, ${slicer.backgroundColor} ${100 - slicer.transparency}%, transparent)` }
            : {}),
        ...(slicer.borderEnabled ? {
            "--filter-row-border-color": slicer.borderColor || "#dddddd",
            "--filter-row-border-width": `${slicer.borderWidth}px`,
            "--filter-row-radius": `${slicer.cornerRadius}px`,
            "--filter-row-padding": "8px",
        } : {}),
    };
}

export function titleStyle(formatting: FilterFormattingValues): VisualStyle {
    const title = formatting.slicer.title;
    return {
        "--title-color": title.color || "#333333",
        "--title-background": title.backgroundColor || "transparent",
        "--title-font-size": `${title.fontSize}px`,
        "--title-font-weight": title.fontWeight,
        "--title-alignment": title.alignment,
    };
}

export function headingStyle(
    formatting: FilterFormattingValues,
    legacy: LegacyRowFormattingValues | undefined,
): VisualStyle {
    return {
        visibility: formatting.showFilterName ? "visible" : "hidden",
        "--filter-label-color": formatting.headingTextColor || legacy?.labelTextColor || "#333333",
        "--filter-label-bg": formatting.headingBackgroundColor || legacy?.labelBackgroundColor || "transparent",
        "--filter-label-font-size": `${formatting.headingFontSize}px`,
    };
}

function selectorAppearance(
    formatting: FilterFormattingValues,
    kind: "field" | "value",
): DropdownFormattingValues {
    return kind === "field" ? formatting.fieldDropdown : formatting.valueDropdown;
}

export function selectorStyle(
    formatting: FilterFormattingValues,
    legacy: LegacyRowFormattingValues | undefined,
    global: VisualFormattingValues["dropdown"],
    kind: "field" | "value",
): VisualStyle {
    const appearance = selectorAppearance(formatting, kind);
    const legacyBackground = kind === "field" ? legacy?.fieldBackground : legacy?.valueBackground;
    const legacyText = kind === "field" ? legacy?.fieldText : legacy?.valueText;
    const isField = kind === "field";
    const fontSize = appearance.fontSize || 13;
    const optionFontSize = isField
        ? fontSize
        : formatting.valueDropdown.fontSize !== 13
            ? formatting.valueDropdown.fontSize
            : formatting.slicer.fontSize !== 13
                ? formatting.slicer.fontSize
                : fontSize;
    const fontWeight = !isField && formatting.slicer.bold && appearance.fontWeight === "normal"
        ? "bold"
        : appearance.fontWeight || "normal";

    return {
        "--dropdown-bg": appearance.backgroundColor || legacyBackground || global.backgroundColor,
        "--dropdown-color": appearance.textColor || formatting.slicer.fontColor || legacyText || global.textColor,
        "--dropdown-border": appearance.borderColor || legacy?.borderColor || global.borderColor,
        "--dropdown-border-width": `${appearance.borderWidth}px`,
        "--dropdown-radius": `${appearance.borderRadius}px`,
        "--dropdown-menu-radius": appearance.borderRadius === 22 ? "14px" : `${appearance.borderRadius}px`,
        "--dropdown-icon": appearance.iconColor || global.iconColor,
        "--dropdown-icon-size": `${appearance.iconSize}px`,
        "--dropdown-padding": appearance.padding === 14 ? "10px 14px" : `${appearance.padding}px`,
        "--dropdown-font-size": `${fontSize}px`,
        "--dropdown-option-font-size": `${optionFontSize}px`,
        "--dropdown-font-weight": fontWeight,
        "--dropdown-font-family": formatting.slicer.fontFamily || "inherit",
        "--dropdown-font-style": !isField && formatting.slicer.italic ? "italic" : "normal",
        "--dropdown-hover-bg": appearance.hoverColor || "#f2f4f6",
        "--dropdown-selected-bg": appearance.selectedBackgroundColor || global.selectionBackgroundColor,
        "--dropdown-selected-color": appearance.selectedTextColor || global.selectionTextColor,
        "--dropdown-checkbox-color": appearance.checkboxColor || appearance.selectedBackgroundColor || "#258447",
    };
}
