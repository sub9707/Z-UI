export const STORE_COLOR_PALETTE = ['blue', 'green', 'amber', 'purple'] as const;

const STORE_COLOR_MAP: Record<string, string> = {
    blue: 'var(--color-blue)',
    green: 'var(--color-green)',
    amber: 'var(--color-primary)',
    purple: 'var(--color-purple)',
};

export const resolveStoreColor = (color: string | undefined): string => {
    if (!color) return 'var(--border-default)';
    return STORE_COLOR_MAP[color] ?? 'var(--border-default)';
};
