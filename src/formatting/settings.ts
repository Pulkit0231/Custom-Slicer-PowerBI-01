import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { MAX_FILTERS } from "../constants/filter.constants";
import type {
    FilterFormattingValues,
    FilterType,
    FontWeight,
    SelectionMode,
    TextAlignment,
    VisualFormattingValues,
} from "../types/formatting.types";
import { DEFAULT_DROPDOWN_COLORS } from "./defaults";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsGroup = formattingSettings.Group;
import FormattingSettingsModel = formattingSettings.Model;
import FormattingSettingsSlice = formattingSettings.Slice;

type Choice = "normal" | "semibold" | "bold" | "left" | "center" | "right" | FilterType;

const SELECTION_MODE_ITEMS: powerbi.IEnumMember[] = [
    { value: "single", displayName: "Single Select" },
    { value: "multi", displayName: "Multi Select" },
];
const FILTER_TYPE_ITEMS: powerbi.IEnumMember[] = [
    { value: "dropdown", displayName: "Current Dropdown" },
    { value: "list", displayName: "List Slicer" },
    { value: "button", displayName: "Button Slicer" },
    { value: "option", displayName: "Option Slicer" },
];
const FONT_WEIGHT_ITEMS: powerbi.IEnumMember[] = [
    { value: "normal", displayName: "Normal" },
    { value: "semibold", displayName: "Semibold" },
    { value: "bold", displayName: "Bold" },
];
const ALIGNMENT_ITEMS: powerbi.IEnumMember[] = [
    { value: "left", displayName: "Left" },
    { value: "center", displayName: "Center" },
    { value: "right", displayName: "Right" },
];
function colorPicker(name: string, displayName: string, value = "", optional = false) {
    return new formattingSettings.ColorPicker({
        name,
        displayName,
        value: { value },
        defaultColor: { value },
        isNoFillItemSupported: optional,
    });
}

function numberInput(name: string, displayName: string, value: number, unitSymbol = "px") {
    return new formattingSettings.NumUpDown({
        name,
        displayName,
        value,
        options: { unitSymbol, unitSymbolAfterInput: true },
    });
}

function enumDropdown(name: string, displayName: string, items: powerbi.IEnumMember[], value: Choice) {
    const selectedItem = items.find((item) => item.value === value) ?? items[0];
    if (!selectedItem) throw new Error(`Formatting dropdown '${name}' requires at least one item.`);
    return new formattingSettings.ItemDropdown({
        name,
        displayName,
        items,
        value: selectedItem,
    });
}

/** Hidden compatibility card. Existing saved labels are still loaded and used as fallbacks. */
class FilterLabelsCard extends FormattingSettingsCompositeCard {
    name = "filterLabels";
    displayName = "Filter Labels";
    visible = false;
    labelInputs = Array.from({ length: MAX_FILTERS }, (_, index) => new formattingSettings.TextInput({
        name: `label${index + 1}`,
        displayName: `Filter ${index + 1} Label`,
        placeholder: `Filter ${index + 1}`,
        value: `Filter ${index + 1}`,
    }));
    groups = this.labelInputs.map((input, index) => new FormattingSettingsGroup({
        name: `filterLabel${index + 1}`,
        displayName: `Filter ${index + 1}`,
        collapsible: true,
        slices: [input],
    }));
}

interface RowAppearanceSettings {
    labelTextColor: formattingSettings.ColorPicker;
    labelBackgroundColor: formattingSettings.ColorPicker;
}

/** Hidden compatibility card for reports that already use the original row-label colors. */
class FilterRowAppearanceCard extends FormattingSettingsCompositeCard {
    name = "filterRowAppearance";
    displayName = "Filter Row Appearance";
    visible = false;
    rowSettings: RowAppearanceSettings[] = Array.from({ length: MAX_FILTERS }, (_, index) => ({
        labelTextColor: colorPicker(`labelTextColor${index + 1}`, "Label text color", "#333333"),
        labelBackgroundColor: colorPicker(`labelBackgroundColor${index + 1}`, "Label background color", "", true),
    }));
    groups = this.rowSettings.map((row, index) => new FormattingSettingsGroup({
        name: `filterRowAppearance${index + 1}`,
        displayName: `Filter ${index + 1}`,
        collapsible: true,
        slices: [row.labelTextColor, row.labelBackgroundColor],
    }));
}

/** Hidden compatibility card for the original shared dropdown palette. */
class DropdownAppearanceCard extends FormattingSettingsCard {
    name = "dropdownAppearance";
    displayName = "Dropdown Appearance";
    visible = false;
    backgroundColor = colorPicker("backgroundColor", "Background color", "#ffffff");
    textColor = colorPicker("textColor", "Text color", "#333333");
    borderColor = colorPicker("borderColor", "Border color", "#dddddd");
    iconColor = colorPicker("iconColor", "Chevron color", "#777777");
    selectionBackgroundColor = colorPicker("selectionBackgroundColor", "Selected option background", "#edf5ef");
    selectionTextColor = colorPicker("selectionTextColor", "Selected option text", "#246b3a");
    slices: FormattingSettingsSlice[] = [
        this.backgroundColor,
        this.textColor,
        this.borderColor,
        this.iconColor,
        this.selectionBackgroundColor,
        this.selectionTextColor,
    ];
}

interface DropdownOverrideSettings {
    fieldBackground: formattingSettings.ColorPicker;
    fieldText: formattingSettings.ColorPicker;
    valueBackground: formattingSettings.ColorPicker;
    valueText: formattingSettings.ColorPicker;
    borderColor: formattingSettings.ColorPicker;
}

/** Hidden compatibility card for existing per-filter dropdown color overrides. */
class FilterDropdownOverridesCard extends FormattingSettingsCompositeCard {
    name = "filterDropdownOverrides";
    displayName = "Filter Dropdown Overrides";
    visible = false;
    rowSettings: DropdownOverrideSettings[] = Array.from({ length: MAX_FILTERS }, (_, index) => ({
        fieldBackground: colorPicker(`fieldBackground${index + 1}`, "Field dropdown background", "", true),
        fieldText: colorPicker(`fieldText${index + 1}`, "Field dropdown text", "", true),
        valueBackground: colorPicker(`valueBackground${index + 1}`, "Value dropdown background", "", true),
        valueText: colorPicker(`valueText${index + 1}`, "Value dropdown text", "", true),
        borderColor: colorPicker(`borderColor${index + 1}`, "Dropdown border color", "", true),
    }));
    groups = this.rowSettings.map((row, index) => new FormattingSettingsGroup({
        name: `filterDropdownOverrides${index + 1}`,
        displayName: `Filter ${index + 1}`,
        collapsible: true,
        slices: [row.fieldBackground, row.fieldText, row.valueBackground, row.valueText, row.borderColor],
    }));
}

type ControlKind = "text" | "toggle" | "color" | "number" | "weight" | "alignment" | "fontFamily" | "selectionMode" | "filterType";
interface ControlDefinition {
    name: string;
    label: string;
    kind: ControlKind;
    defaultValue?: string | number | boolean;
    optional?: boolean;
    unit?: string;
}

const FILTER_CONTROLS: ControlDefinition[] = [
    { name: "showFilterName", label: "Show Filter Name", kind: "toggle", defaultValue: true },
    { name: "customName", label: "Filter Name", kind: "text", defaultValue: "" },
    { name: "headingFontSize", label: "Text Size", kind: "number", defaultValue: 14 },
    { name: "headingTextColor", label: "Heading Text Color", kind: "color", optional: true },
    { name: "headingBackgroundColor", label: "Heading Background Color", kind: "color", optional: true },
    { name: "filterType", label: "Filter Type", kind: "filterType", defaultValue: "dropdown" },
    { name: "selectionMode", label: "Selection Mode", kind: "selectionMode", defaultValue: "single" },
    { name: "showTitle", label: "Show Title", kind: "toggle", defaultValue: false },
    { name: "titleText", label: "Title Text", kind: "text", defaultValue: "" },
    { name: "titleColor", label: "Title Color", kind: "color", optional: true },
    { name: "titleBackgroundColor", label: "Title Background Color", kind: "color", optional: true },
    { name: "titleFontSize", label: "Title Font Size", kind: "number", defaultValue: 14 },
    { name: "titleFontWeight", label: "Title Font Weight", kind: "weight", defaultValue: "normal" },
    { name: "titleAlignment", label: "Title Alignment", kind: "alignment", defaultValue: "left" },

    { name: "fieldBackgroundColor", label: "Background Color", kind: "color", optional: true },
    { name: "fieldTextColor", label: "Text Color", kind: "color", optional: true },
    { name: "fieldFontSize", label: "Font Size", kind: "number", defaultValue: 13 },
    { name: "fieldFontWeight", label: "Font Weight", kind: "weight", defaultValue: "normal" },
    { name: "fieldBorderColor", label: "Border Color", kind: "color", optional: true },
    { name: "fieldBorderWidth", label: "Border Width", kind: "number", defaultValue: 1 },
    { name: "fieldBorderRadius", label: "Border Radius", kind: "number", defaultValue: 22 },
    { name: "fieldIconColor", label: "Dropdown Icon Color", kind: "color", optional: true },
    { name: "fieldIconSize", label: "Dropdown Icon Size", kind: "number", defaultValue: 16 },
    { name: "fieldPadding", label: "Padding", kind: "number", defaultValue: 14 },
    { name: "fieldHoverColor", label: "Hover Color", kind: "color", optional: true },
    { name: "fieldSelectedBackgroundColor", label: "Selected Item Background", kind: "color", optional: true },
    { name: "fieldSelectedTextColor", label: "Selected Item Text Color", kind: "color", optional: true },

    { name: "valueBackgroundColor", label: "Background Color", kind: "color", optional: true },
    { name: "valueTextColor", label: "Text Color", kind: "color", optional: true },
    { name: "valueFontSize", label: "Font Size", kind: "number", defaultValue: 13 },
    { name: "valueFontWeight", label: "Font Weight", kind: "weight", defaultValue: "normal" },
    { name: "valueBorderColor", label: "Border Color", kind: "color", optional: true },
    { name: "valueBorderWidth", label: "Border Width", kind: "number", defaultValue: 1 },
    { name: "valueBorderRadius", label: "Border Radius", kind: "number", defaultValue: 22 },
    { name: "valueIconColor", label: "Dropdown Icon Color", kind: "color", optional: true },
    { name: "valueIconSize", label: "Dropdown Icon Size", kind: "number", defaultValue: 16 },
    { name: "valuePadding", label: "Padding", kind: "number", defaultValue: 14 },
    { name: "valueHoverColor", label: "Hover Color", kind: "color", optional: true },
    { name: "valueSelectedBackgroundColor", label: "Selected Item Background", kind: "color", optional: true },
    { name: "valueSelectedTextColor", label: "Selected Item Text Color", kind: "color", optional: true },
    { name: "valueCheckboxColor", label: "Checkbox Color", kind: "color", optional: true },

    { name: "slicerFontFamily", label: "Font Family", kind: "fontFamily", defaultValue: "Segoe UI" },
    { name: "slicerFontSize", label: "Font Size", kind: "number", defaultValue: 13 },
    { name: "slicerFontColor", label: "Font Color", kind: "color", optional: true },
    { name: "slicerBold", label: "Bold", kind: "toggle", defaultValue: false },
    { name: "slicerItalic", label: "Italic", kind: "toggle", defaultValue: false },
    { name: "slicerBackgroundEnabled", label: "Background", kind: "toggle", defaultValue: false },
    { name: "slicerBackgroundColor", label: "Background Color", kind: "color", optional: true },
    { name: "slicerTransparency", label: "Transparency", kind: "number", defaultValue: 0, unit: "%" },
    { name: "slicerBorderEnabled", label: "Border", kind: "toggle", defaultValue: false },
    { name: "slicerBorderColor", label: "Border Color", kind: "color", optional: true },
    { name: "slicerBorderWidth", label: "Border Width", kind: "number", defaultValue: 1 },
    { name: "slicerCornerRadius", label: "Corner Radius", kind: "number", defaultValue: 4 },
];

const FILTER_GROUPS: Array<{ name: string; label: string; controls: string[] }> = [
    { name: "filterName", label: "Filter Name", controls: ["showFilterName", "customName", "headingFontSize", "headingTextColor", "headingBackgroundColor"] },
    { name: "filterSettings", label: "Filter Settings", controls: ["filterType"] },
    { name: "fieldSelectorAppearance", label: "Field Selector Appearance", controls: [
        "fieldBackgroundColor", "fieldTextColor", "fieldFontSize", "fieldFontWeight", "fieldBorderColor", "fieldBorderWidth", "fieldBorderRadius", "fieldIconColor", "fieldIconSize", "fieldPadding", "fieldHoverColor", "fieldSelectedBackgroundColor", "fieldSelectedTextColor",
    ] },
    { name: "valueSelectorSettings", label: "Value Selector Settings", controls: ["selectionMode"] },
    { name: "valueSelectorAppearance", label: "Value Selector Appearance", controls: [
        "valueBackgroundColor", "valueTextColor", "valueFontSize", "valueFontWeight", "valueBorderColor", "valueBorderWidth", "valueBorderRadius", "valueIconColor", "valueIconSize", "valuePadding", "valueHoverColor", "valueSelectedBackgroundColor", "valueSelectedTextColor", "valueCheckboxColor",
    ] },
    { name: "slicerAppearance", label: "Slicer Appearance", controls: [
        "slicerFontFamily", "slicerFontSize", "slicerFontColor", "slicerBold", "slicerItalic",
    ] },
    { name: "filterContainerAppearance", label: "Filter Container Appearance", controls: [
        "slicerBackgroundEnabled", "slicerBackgroundColor", "slicerTransparency", "slicerBorderEnabled", "slicerBorderColor", "slicerBorderWidth", "slicerCornerRadius",
    ] },
    { name: "titleSettings", label: "Title Settings", controls: ["showTitle", "titleText", "titleColor", "titleBackgroundColor", "titleFontSize", "titleFontWeight", "titleAlignment"] },
];

function createControl(definition: ControlDefinition, number: number): FormattingSettingsSlice {
    const name = definition.name;
    const propertyName = `${name}`;
    const value = definition.defaultValue;
    switch (definition.kind) {
        case "text":
            return new formattingSettings.TextInput({
                name: propertyName,
                displayName: definition.label,
                placeholder: name === "customName" ? `Filter ${number}` : "",
                value: typeof value === "string" ? value : "",
            });
        case "toggle":
            return new formattingSettings.ToggleSwitch({
                name: propertyName,
                displayName: definition.label,
                value: typeof value === "boolean" ? value : false,
            });
        case "color":
            return colorPicker(propertyName, definition.label, "", definition.optional ?? false);
        case "number":
            return numberInput(propertyName, definition.label, typeof value === "number" ? value : 0, definition.unit);
        case "weight":
            return enumDropdown(propertyName, definition.label, FONT_WEIGHT_ITEMS, (value as FontWeight | undefined) ?? "normal");
        case "alignment":
            return enumDropdown(propertyName, definition.label, ALIGNMENT_ITEMS, (value as "left" | "center" | "right" | undefined) ?? "left");
        case "fontFamily":
            return new formattingSettings.FontPicker({
                name: propertyName,
                displayName: definition.label,
                value: typeof value === "string" ? value : "Segoe UI",
            });
        case "selectionMode":
            if (!SELECTION_MODE_ITEMS[0]) throw new Error("Selection mode options are not configured.");
            return new formattingSettings.ItemDropdown({
                name: propertyName,
                displayName: definition.label,
                items: SELECTION_MODE_ITEMS,
                value: SELECTION_MODE_ITEMS[0],
            });
        case "filterType":
            if (!FILTER_TYPE_ITEMS[0]) throw new Error("Filter type options are not configured.");
            return new formattingSettings.ItemDropdown({
                name: propertyName,
                displayName: definition.label,
                items: FILTER_TYPE_ITEMS,
                value: FILTER_TYPE_ITEMS[0],
            });
    }
}

class FilterFormattingCard extends FormattingSettingsCompositeCard {
    name = "";
    displayName = "";
    controls: Record<string, FormattingSettingsSlice>;
    groups: FormattingSettingsGroup[];

    constructor(filterNumber: number) {
        super();
        this.name = `filter${filterNumber}`;
        this.displayName = `Filter ${filterNumber}`;
        this.controls = Object.fromEntries(FILTER_CONTROLS.map((definition) => [
            definition.name,
            createControl(definition, filterNumber),
        ]));
        this.groups = FILTER_GROUPS.map((group) => new FormattingSettingsGroup({
            name: `${this.name}${group.name}`,
            displayName: group.label,
            collapsible: true,
            visible: group.name !== "slicerAppearance",
            slices: group.controls.flatMap((controlName) => {
                const control = this.controls[controlName];
                return control ? [control] : [];
            }),
        }));
    }
}

function colorValue(slice: formattingSettings.ColorPicker): string {
    return slice.value?.value?.trim() ?? "";
}

function controlValue(card: FilterFormattingCard, name: string): unknown {
    const control = card.controls[name];
    if (!control) return undefined;
    return (control as formattingSettings.SimpleSlice<unknown>).value;
}

function colorControl(card: FilterFormattingCard, name: string): string {
    const value = controlValue(card, name) as powerbi.ThemeColorData | undefined;
    return value?.value?.trim() ?? "";
}

function numberControl(card: FilterFormattingCard, name: string): number {
    const value = controlValue(card, name);
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function textControl(card: FilterFormattingCard, name: string): string {
    const value = controlValue(card, name);
    return typeof value === "string" ? value.trim() : "";
}

function toggleControl(card: FilterFormattingCard, name: string): boolean {
    return controlValue(card, name) === true;
}

function fontFamilyControl(card: FilterFormattingCard, name: string): string {
    const value = controlValue(card, name);
    return typeof value === "string" && value.trim() ? value.trim() : "Segoe UI";
}

function enumControl<T extends string>(card: FilterFormattingCard, name: string, fallback: T): T {
    const value = controlValue(card, name) as powerbi.IEnumMember | undefined;
    return typeof value?.value === "string" ? value.value as T : fallback;
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    filterLabels = new FilterLabelsCard();
    filterRowAppearance = new FilterRowAppearanceCard();
    dropdownAppearance = new DropdownAppearanceCard();
    filterDropdownOverrides = new FilterDropdownOverridesCard();
    filterCards = Array.from({ length: MAX_FILTERS }, (_, index) => new FilterFormattingCard(index + 1));

    cards = [
        ...this.filterCards,
        this.filterLabels,
        this.filterRowAppearance,
        this.dropdownAppearance,
        this.filterDropdownOverrides,
    ];

    toValues(legacyFilterTypes: Array<FilterType | undefined> = []): VisualFormattingValues {
        return {
            labels: this.filterLabels.labelInputs.map((input) => input.value?.trim() ?? ""),
            dropdown: {
                backgroundColor: colorValue(this.dropdownAppearance.backgroundColor) || DEFAULT_DROPDOWN_COLORS.backgroundColor,
                textColor: colorValue(this.dropdownAppearance.textColor) || DEFAULT_DROPDOWN_COLORS.textColor,
                borderColor: colorValue(this.dropdownAppearance.borderColor) || DEFAULT_DROPDOWN_COLORS.borderColor,
                iconColor: colorValue(this.dropdownAppearance.iconColor) || DEFAULT_DROPDOWN_COLORS.iconColor,
                selectionBackgroundColor: colorValue(this.dropdownAppearance.selectionBackgroundColor) || DEFAULT_DROPDOWN_COLORS.selectionBackgroundColor,
                selectionTextColor: colorValue(this.dropdownAppearance.selectionTextColor) || DEFAULT_DROPDOWN_COLORS.selectionTextColor,
            },
            rows: this.filterRowAppearance.rowSettings.map((appearance, index) => {
                const overrides = this.filterDropdownOverrides.rowSettings[index];
                return {
                    labelTextColor: colorValue(appearance.labelTextColor),
                    labelBackgroundColor: colorValue(appearance.labelBackgroundColor),
                    fieldBackground: overrides ? colorValue(overrides.fieldBackground) : "",
                    fieldText: overrides ? colorValue(overrides.fieldText) : "",
                    valueBackground: overrides ? colorValue(overrides.valueBackground) : "",
                    valueText: overrides ? colorValue(overrides.valueText) : "",
                    borderColor: overrides ? colorValue(overrides.borderColor) : "",
                };
            }),
            filters: this.filterCards.map((card, index): FilterFormattingValues => ({
                showFilterName: controlValue(card, "showFilterName") !== false,
                customName: textControl(card, "customName"),
                headingFontSize: numberControl(card, "headingFontSize"),
                selectionMode: enumControl<SelectionMode>(card, "selectionMode", "single"),
                headingTextColor: colorControl(card, "headingTextColor"),
                headingBackgroundColor: colorControl(card, "headingBackgroundColor"),
                filterType: legacyFilterTypes[index]
                    ?? enumControl<FilterType>(card, "filterType", "dropdown"),
                fieldDropdown: {
                    backgroundColor: colorControl(card, "fieldBackgroundColor"),
                    textColor: colorControl(card, "fieldTextColor"),
                    fontSize: numberControl(card, "fieldFontSize"),
                    fontWeight: enumControl(card, "fieldFontWeight", "normal"),
                    borderColor: colorControl(card, "fieldBorderColor"),
                    borderWidth: numberControl(card, "fieldBorderWidth"),
                    borderRadius: numberControl(card, "fieldBorderRadius"),
                    iconColor: colorControl(card, "fieldIconColor"),
                    iconSize: numberControl(card, "fieldIconSize"),
                    padding: numberControl(card, "fieldPadding"),
                    hoverColor: colorControl(card, "fieldHoverColor"),
                    selectedBackgroundColor: colorControl(card, "fieldSelectedBackgroundColor"),
                    selectedTextColor: colorControl(card, "fieldSelectedTextColor"),
                    checkboxColor: "",
                },
                valueDropdown: {
                    backgroundColor: colorControl(card, "valueBackgroundColor"),
                    textColor: colorControl(card, "valueTextColor"),
                    fontSize: numberControl(card, "valueFontSize"),
                    fontWeight: enumControl(card, "valueFontWeight", "normal"),
                    borderColor: colorControl(card, "valueBorderColor"),
                    borderWidth: numberControl(card, "valueBorderWidth"),
                    borderRadius: numberControl(card, "valueBorderRadius"),
                    iconColor: colorControl(card, "valueIconColor"),
                    iconSize: numberControl(card, "valueIconSize"),
                    padding: numberControl(card, "valuePadding"),
                    hoverColor: colorControl(card, "valueHoverColor"),
                    selectedBackgroundColor: colorControl(card, "valueSelectedBackgroundColor"),
                    selectedTextColor: colorControl(card, "valueSelectedTextColor"),
                    checkboxColor: colorControl(card, "valueCheckboxColor"),
                },
                slicer: {
                    title: {
                        show: toggleControl(card, "showTitle"),
                        text: textControl(card, "titleText"),
                        color: colorControl(card, "titleColor"),
                        backgroundColor: colorControl(card, "titleBackgroundColor"),
                        fontSize: numberControl(card, "titleFontSize"),
                        fontWeight: enumControl(card, "titleFontWeight", "normal"),
                    alignment: enumControl<TextAlignment>(card, "titleAlignment", "left"),
                    },
                    fontFamily: fontFamilyControl(card, "slicerFontFamily"),
                    fontSize: numberControl(card, "slicerFontSize"),
                    fontColor: colorControl(card, "slicerFontColor"),
                    bold: toggleControl(card, "slicerBold"),
                    italic: toggleControl(card, "slicerItalic"),
                    backgroundEnabled: toggleControl(card, "slicerBackgroundEnabled"),
                    backgroundColor: colorControl(card, "slicerBackgroundColor"),
                    transparency: Math.min(100, Math.max(0, numberControl(card, "slicerTransparency"))),
                    borderEnabled: toggleControl(card, "slicerBorderEnabled"),
                    borderColor: colorControl(card, "slicerBorderColor"),
                    borderWidth: numberControl(card, "slicerBorderWidth"),
                    cornerRadius: numberControl(card, "slicerCornerRadius"),
                },
            })),
        };
    }
}
