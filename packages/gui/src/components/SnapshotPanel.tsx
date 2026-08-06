import { useState } from 'react';
import { useZuiStore } from '../store/zuiStore';
import { markRestoring } from '../utils/restoreTracker';

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
        <div>
            <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Snapshot label (e.g. before login)"
            />
            <button type="button" onClick={saveSnapshot}>Save Snapshot</button>

            <div>
                {snapshots.map((record) => (
                    <div key={record.saveID}>
                        <span>{record.label} · {new Date(record.timeStamp).toLocaleTimeString()}</span>
                        <button type="button" onClick={() => restoreSnapshot(record.label, record.snapshot)}>Restore</button>
                        <button type="button" onClick={() => deleteSnapshot(record.saveID)}>Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SnapshotPanel;
