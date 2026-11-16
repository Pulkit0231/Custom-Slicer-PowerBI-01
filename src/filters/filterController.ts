import powerbi from "powerbi-visuals-api";
import { FILTER_OBJECT_NAME, FILTER_PROPERTY_NAME } from "../constants/filter.constants";
import type { FilterSelection } from "../types/filter.types";
import { buildJsonFilters } from "./filterBuilder";
import { filterSelectionSignature } from "./filterSignature";

export class FilterController {
    private lastAppliedSignature: string | undefined;

    public constructor(private readonly host: powerbi.extensibility.visual.IVisualHost) {}

    public apply(selections: readonly FilterSelection[]): boolean {
        const filters = buildJsonFilters(selections);
        if (!filters) return false;

        const signature = filterSelectionSignature(selections);
        if (signature === this.lastAppliedSignature) return true;

        this.host.applyJsonFilter(
            null as unknown as powerbi.IFilter,
            FILTER_OBJECT_NAME,
            FILTER_PROPERTY_NAME,
            powerbi.FilterAction.remove,
        );
        if (filters.length > 0) {
            this.host.applyJsonFilter(
                filters,
                FILTER_OBJECT_NAME,
                FILTER_PROPERTY_NAME,
                powerbi.FilterAction.merge,
            );
        }
        this.lastAppliedSignature = signature;
        return true;
    }
}
