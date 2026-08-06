import { useState, type CSSProperties } from 'react';
import styles from './JsonTree.module.css';

type Path = (string | number)[];

type JsonTreeProps = {
    data: Record<string, unknown>;
    onEdit: (path: Path, newValue: unknown) => void;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const parseEditedValue = (raw: string, original: unknown): unknown => {
    if (typeof original === 'number') return Number(raw);
    if (typeof original === 'boolean') return raw === 'true';
    return raw;
};

const valueClass = (value: unknown): string => {
    if (value === null || value === undefined) return styles.valueNull ?? '';
    if (typeof value === 'string') return styles.valueString ?? '';
    if (typeof value === 'number') return styles.valueNumber ?? '';
    if (typeof value === 'boolean') return styles.valueBoolean ?? '';
    return '';
};

function JsonTree({ data, onEdit }: JsonTreeProps) {
    return (
        <div className={styles.tree}>
            {Object.entries(data)
                .filter(([, value]) => typeof value !== 'function')
                .map(([key, value]) => (
                    <JsonNode key={key} label={key} value={value} path={[key]} depth={0} onEdit={onEdit} />
                ))}
        </div>
    );
}

type JsonNodeProps = {
    label: string | number;
    value: unknown;
    path: Path;
    depth: number;
    onEdit: (path: Path, newValue: unknown) => void;
};

function JsonNode({ label, value, path, depth, onEdit }: JsonNodeProps) {
    const isArray = Array.isArray(value);
    const [expanded, setExpanded] = useState(!isArray);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');

    const isContainer = isArray || isPlainObject(value);

    const commitEdit = () => {
        onEdit(path, parseEditedValue(draft, value));
        setEditing(false);
    };

    if (isContainer) {
        const entries = isArray
            ? (value as unknown[]).map((item, idx) => [idx, item] as const)
            : Object.entries(value as Record<string, unknown>).filter(([, v]) => typeof v !== 'function');

        return (
            <div>
                <button
                    type="button"
                    className={styles.rowToggle}
                    style={{ '--depth': depth } as CSSProperties}
                    onClick={() => setExpanded((v) => !v)}
                >
                    <span className={styles.indent} />
                    <svg
                        className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                    >
                        <path d="M3 1.5L7 5L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={styles.key}>{label}</span>
                    <span className={styles.badge}>{isArray ? `Array(${entries.length})` : `{${entries.length}}`}</span>
                </button>
                <div className={`${styles.children} ${expanded ? styles.childrenOpen : ''}`}>
                    <div className={styles.childrenInner}>
                        {entries.map(([childKey, childValue]) => (
                            <JsonNode
                                key={childKey}
                                label={childKey}
                                value={childValue}
                                path={[...path, childKey]}
                                depth={depth + 1}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.row} style={{ '--depth': depth } as CSSProperties}>
            <span className={styles.indent} />
            <span className={styles.chevronSpacer} />
            <span className={styles.key}>{label}</span>
            {editing ? (
                <input
                    autoFocus
                    className={styles.input}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') setEditing(false);
                    }}
                />
            ) : (
                <span className={`${styles.value} ${valueClass(value)}`}>{String(value)}</span>
            )}
            {!editing && (
                <button
                    className={styles.editButton}
                    onClick={() => {
                        setDraft(String(value));
                        setEditing(true);
                    }}
                >
                    Edit
                </button>
            )}
        </div>
    );
}

export default JsonTree;
