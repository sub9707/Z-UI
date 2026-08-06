const pendingRestores = new Set<string>();

export const markRestoring = (storeName: string): void => {
    pendingRestores.add(storeName);
};

export const consumeRestoring = (storeName: string): boolean => {
    if (!pendingRestores.has(storeName)) return false;
    pendingRestores.delete(storeName);
    return true;
};
