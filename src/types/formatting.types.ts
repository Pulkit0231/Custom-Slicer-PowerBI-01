export type SelectionMode = "single" | "multi";
export type FilterType = "dropdown" | "list" | "button" | "option";
export type FontWeight = "normal" | "semibold" | "bold";
export type TextAlignment = "left" | "center" | "right";

export interface DropdownFormattingValues {
    readonly backgroundColor: string;
    readonly textColor: string;
    readonly fontSize: number;
    readonly fontWeight: FontWeight;
    readonly borderColor: string;
    readonly borderWidth: number;
    readonly borderRadius: number;
    readonly iconColor: string;
    readonly iconSize: number;
    readonly padding: number;
    readonly hoverColor: string;
    readonly selectedBackgroundColor: string;
    readonly selectedTextColor: string;
    readonly checkboxColor: string;
}

export interface FilterSlicerValues {
    readonly title: {
        readonly show: boolean;
        readonly text: string;
        readonly color: string;
        readonly backgroundColor: string;
        readonly fontSize: number;
        readonly fontWeight: FontWeight;
        readonly alignment: TextAlignment;
    };
    readonly fontFamily: string;
    readonly fontSize: number;
    readonly fontColor: string;
    readonly bold: boolean;
    readonly italic: boolean;
    readonly backgroundEnabled: boolean;
    readonly backgroundColor: string;
    readonly transparency: number;
    readonly borderEnabled: boolean;
    readonly borderColor: string;
    readonly borderWidth: number;
    readonly cornerRadius: number;
}

export interface FilterFormattingValues {
    readonly showFilterName: boolean;
    readonly customName: string;
    readonly headingFontSize: number;
    readonly selectionMode: SelectionMode;
    readonly headingTextColor: string;
    readonly headingBackgroundColor: string;
    readonly filterType: FilterType;
    readonly fieldDropdown: DropdownFormattingValues;
    readonly valueDropdown: DropdownFormattingValues;
    readonly slicer: FilterSlicerValues;
}

export interface LegacyRowFormattingValues {
    readonly labelTextColor: string;
    readonly labelBackgroundColor: string;
    readonly fieldBackground: string;
    readonly fieldText: string;
    readonly valueBackground: string;
    readonly valueText: string;
    readonly borderColor: string;
}

export interface VisualFormattingValues {
    readonly labels: readonly string[];
    readonly dropdown: {
        readonly backgroundColor: string;
        readonly textColor: string;
        readonly borderColor: string;
        readonly iconColor: string;
        readonly selectionBackgroundColor: string;
        readonly selectionTextColor: string;
    };
    readonly rows: readonly LegacyRowFormattingValues[];
    readonly filters: readonly FilterFormattingValues[];
}
