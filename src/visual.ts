import powerbi from "powerbi-visuals-api";
import React from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { FilterPanel } from "./components/FilterPanel";
import { parseDataView } from "./data/dataViewParser";
import { restoreFilterSelections } from "./data/filterRestoration";
import { FilterController } from "./filters/filterController";
import { readLegacyFilterTypes } from "./formatting/legacySettings";
import { VisualFormattingSettingsModel } from "./formatting/settings";
import type { AvailableField } from "./types/data.types";
import type { FilterSelection } from "./types/filter.types";
import type { FilterType } from "./types/formatting.types";

export class Visual implements powerbi.extensibility.visual.IVisual {
    private readonly root: Root;
    private readonly formattingService = new FormattingSettingsService();
    private readonly filterController: FilterController;
    private formattingSettings = new VisualFormattingSettingsModel();
    private fields: readonly AvailableField[] = [];
    private hasDataView = false;
    private legacyFilterTypes: Array<FilterType | undefined> = [];

    public constructor(options?: powerbi.extensibility.visual.VisualConstructorOptions) {
        if (!options) throw new Error("Power BI did not provide visual constructor options.");
        this.root = createRoot(options.element);
        this.filterController = new FilterController(options.host);
    }

    public update(options: powerbi.extensibility.visual.VisualUpdateOptions): void {
        const dataView = options.dataViews?.[0];
        if (dataView) {
            this.fields = parseDataView(dataView);
            this.hasDataView = true;
            this.legacyFilterTypes = readLegacyFilterTypes(dataView);
            this.formattingSettings = this.formattingService.populateFormattingSettingsModel(
                VisualFormattingSettingsModel,
                dataView,
            );
        }

        const restoredSelections = restoreFilterSelections(options.jsonFilters, this.fields);
        this.root.render(React.createElement(FilterPanel, {
            fields: this.fields,
            hasDataView: this.hasDataView,
            formatting: this.formattingSettings.toValues(this.legacyFilterTypes),
            restoredSelections,
            onFiltersChange: this.applyFilters,
        }));
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingService.buildFormattingModel(this.formattingSettings);
    }

    public destroy(): void {
        this.root.unmount();
    }

    private readonly applyFilters = (selections: readonly FilterSelection[]): boolean =>
        this.filterController.apply(selections);
}
