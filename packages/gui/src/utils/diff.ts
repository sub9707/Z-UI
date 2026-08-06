export const getChangedKeys = (before: unknown, after: unknown): string[] => {
    if (typeof before !== 'object' || before === null || typeof after !== 'object' || after === null) {
        return [];
    }
    const beforeObj = before as Record<string, unknown>;
    const afterObj = after as Record<string, unknown>;
    const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);

    return Array.from(keys).filter((key) => {
        const beforeValue = beforeObj[key];
        const afterValue = afterObj[key];
        if (typeof beforeValue === 'function' || typeof afterValue === 'function') return false;
        return JSON.stringify(beforeValue) !== JSON.stringify(afterValue);
    });
};
