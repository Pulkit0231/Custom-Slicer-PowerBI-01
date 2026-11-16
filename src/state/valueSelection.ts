export interface KeyedValue {
    readonly key: string;
}

export function allOptionKey(fieldId: string): string {
    return `value-all:${fieldId}`;
}

export function selectedValueKeys<TValue extends KeyedValue>(
    hasField: boolean,
    allKey: string | undefined,
    values: readonly TValue[],
): string[] {
    if (!hasField) return [];
    if (values.length === 0 && allKey) return [allKey];
    return values.map((value) => value.key);
}

export function isAllSelected(selectedKeys: readonly string[], allKey: string | undefined): boolean {
    return allKey !== undefined && selectedKeys.includes(allKey);
}

export function nextValueSelectorKeys(
    clickedKey: string,
    selectedKeys: readonly string[],
    multiple: boolean,
    allKey: string | undefined,
): string[] | undefined {
    if (clickedKey === allKey) {
        return isAllSelected(selectedKeys, allKey) ? undefined : [clickedKey];
    }
    if (!multiple) return selectedKeys.includes(clickedKey) ? [] : [clickedKey];

    const currentKeys = selectedKeys.filter((key) => key !== allKey);
    return currentKeys.includes(clickedKey)
        ? currentKeys.filter((key) => key !== clickedKey)
        : [...currentKeys, clickedKey];
}

export function resolveValueSelection<TValue extends KeyedValue>(
    keys: readonly string[],
    allKey: string | undefined,
    availableValues: readonly TValue[],
    previousValues: readonly TValue[],
): TValue[] {
    if (isAllSelected(keys, allKey)) return [];
    const valuesByKey = new Map<string, TValue>();
    for (const value of [...availableValues, ...previousValues]) valuesByKey.set(value.key, value);
    return keys.flatMap((key) => {
        const value = valuesByKey.get(key);
        return value ? [value] : [];
    });
}
