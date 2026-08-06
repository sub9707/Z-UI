import { useState } from 'react';
import { useZuiStore } from '../store/zuiStore';
import { markRestoring } from '../utils/restoreTracker';
import styles from './SnapshotPanel.module.css';

type SnapshotPanelProps = {
    send: (message: unknown) => void;
};

function SnapshotPanel({ send }: SnapshotPanelProps) {
    const snapshots = useZuiStore((s) => s.snapshots);
    const [label, setLabel] = useState('');

    const saveSnapshot = () => {
        if (!label) return;
        useZuiStore.getState().saveSnapshot(label);
        setLabel('');
    };

    const restoreSnapshot = (label: string, snapshot: Record<string, unknown>) => {
        Object.entries(snapshot).forEach(([name, state]) => {
            markRestoring(name);
            send({ type: 'RESTORE_SNAPSHOT', name, snapshot: state });
        });
        useZuiStore.getState().addActionLog({
            kind: 'restore',
            label,
            stores: Object.keys(snapshot),
        });
    };

    const deleteSnapshot = (saveID: number) => {
        useZuiStore.getState().deleteSnapshot(saveID);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.row}>
                <input
                    className={styles.input}
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Snapshot label (e.g. before login)"
                    onKeyDown={(e) => { if (e.key === 'Enter') saveSnapshot(); }}
                />
                <button type="button" className={styles.saveBtn} onClick={saveSnapshot}>Save</button>
            </div>

            <div className={styles.list}>
                {snapshots.length === 0 && <span className={styles.empty}>No snapshots saved yet.</span>}
                {snapshots.map((record) => (
                    <div className={styles.card} key={record.saveID}>
                        <div className={styles.label}>
                            <span>{record.label}</span>
                            <span className={styles.time}>{new Date(record.timeStamp).toLocaleTimeString()}</span>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={() => restoreSnapshot(record.label, record.snapshot)}>Restore</button>
                            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => deleteSnapshot(record.saveID)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SnapshotPanel;
