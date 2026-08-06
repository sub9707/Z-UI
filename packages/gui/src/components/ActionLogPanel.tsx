import { useState } from 'react';
import { useZuiStore } from '../store/zuiStore';
import { getChangedKeys } from '../utils/diff';
import styles from './ActionLogPanel.module.css';

function ActionLogPanel() {
    const actionLog = useZuiStore((s) => s.actionLog);
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={styles.bar}>
            <button className={styles.header} onClick={() => setIsOpen((v) => !v)}>
                <span className={styles.headerLeft}>
                    Action Log
                    <span className={styles.count}>{actionLog.length}</span>
                </span>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>⌃</span>
            </button>

            <div className={`${styles.content} ${isOpen ? styles.contentOpen : ''}`}>
                {actionLog.length === 0 ? (
                    <div className={styles.empty}>No activity yet.</div>
                ) : (
                    <div className={styles.list}>
                        {actionLog.map((entry) => {
                            if (entry.kind === 'restore') {
                                return (
                                    <div className={styles.entry} key={entry.id}>
                                        <span className={styles.time}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                        <span className={styles.restoreTag}>restored "{entry.label}"</span>
                                        <span className={styles.diff}>{entry.stores.join(', ')}</span>
                                    </div>
                                );
                            }

                            const changedKeys = getChangedKeys(entry.before, entry.after);
                            const afterObj = entry.after as Record<string, unknown>;
                            const beforeObj = entry.before as Record<string, unknown>;

                            return (
                                <div className={styles.entry} key={entry.id}>
                                    <span className={styles.time}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                    <span className={styles.storeTag}>{entry.store}</span>
                                    <span className={styles.diff}>
                                        {changedKeys.length === 0
                                            ? 'no change'
                                            : changedKeys
                                                .map((key) => `${key}: ${String(beforeObj?.[key])} → ${String(afterObj?.[key])}`)
                                                .join('  ·  ')}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ActionLogPanel;
