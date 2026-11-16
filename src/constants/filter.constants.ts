export const MAX_FILTERS = 20;
export const INITIAL_FILTER_ROWS = 4;
export const MAX_TABLE_ROWS = 30_000;
export const FILTER_OBJECT_NAME = "general";
export const FILTER_PROPERTY_NAME = "filter";

export const FIELD_ROLES = Array.from(
    { length: MAX_FILTERS },
    (_, index) => `field${index + 1}`,
);
