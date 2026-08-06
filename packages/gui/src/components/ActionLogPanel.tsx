import { useZuiStore } from '../store/zuiStore';
import { getChangedKeys } from '../utils/diff';

function ActionLogPanel() {
    const actionLog = useZuiStore((s) => s.actionLog);

    return (
        <div>
            {actionLog.map((entry) => {
                if (entry.kind === 'restore') {
                    return (
                        <div key={entry.id}>
                            <div>
                                Restored snapshot "{entry.label}" ({entry.stores.join(', ')}) · {new Date(entry.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    );
                }

                const changedKeys = getChangedKeys(entry.before, entry.after);
                const beforeObj = entry.before as Record<string, unknown>;
                const afterObj = entry.after as Record<string, unknown>;

                return (
                    <div key={entry.id}>
                        <div>
                            [{entry.store}] {entry.action || '(update)'} · {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                        <div>
                            {changedKeys.length === 0 && <span>no change</span>}
                            {changedKeys.map((key) => (
                                <div key={key}>
                                    {key}: {String(beforeObj?.[key])} → {String(afterObj?.[key])}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ActionLogPanel;
