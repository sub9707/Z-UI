import { useEffect, useState } from 'react';
import { useZuiStore } from '../store/zuiStore';
import { markRestoring } from '../utils/restoreTracker';
import { STORE_COLOR_PALETTE } from '../utils/colors';
import JsonTree from './JsonTree';
import styles from './InspectorPanel.module.css';
import swatchColors from '../styles/swatchColors.module.css';

type InspectorPanelProps = {
    send: (message: unknown) => void;
};

function InspectorPanel({ send }: InspectorPanelProps) {
    const stores = useZuiStore((s) => s.stores);
    const selectedStore = useZuiStore((s) => s.selectedStore);
    const dependencyEdges = useZuiStore((s) => s.dependencyEdges);

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (selectedStore) setIsOpen(true);
    }, [selectedStore]);

    const editStateField = (path: (string | number)[], newValue: unknown) => {
        if (!selectedStore) return;
        const currentState = stores[selectedStore]?.currentState as Record<string, unknown> | undefined;
        if (!currentState) return;

        const rootKey = path[0] as string;

        if (path.length === 1) {
            send({ type: 'SET_STATE', name: selectedStore, newState: { [rootKey]: newValue } });
            return;
        }

        // zustand의 set()은 최상위 키만 병합하므로, 중첩 필드를 바꾸려면
        // 해당 최상위 키의 값을 통째로 복제 후 수정해서 다시 보내야 한다.
        const rootValueClone = structuredClone(currentState[rootKey]);
        let cursor = rootValueClone as Record<string | number, unknown>;
        for (let i = 1; i < path.length - 1; i++) {
            cursor = cursor[path[i] as string | number] as Record<string | number, unknown>;
        }
        cursor[path[path.length - 1] as string | number] = newValue;

        send({ type: 'SET_STATE', name: selectedStore, newState: { [rootKey]: rootValueClone } });
    };

    const resetStore = () => {
        if (!selectedStore) return;
        const snapshot = stores[selectedStore]?.initialState;
        markRestoring(selectedStore);
        send({ type: 'RESTORE_SNAPSHOT', name: selectedStore, snapshot });
    };

    const deleteStoreHandler = () => {
        if (!selectedStore) return;
        const confirmed = window.confirm(`Delete ${selectedStore}? (moved to .zui-trash, recoverable)`);
        if (!confirmed) return;
        send({ type: 'DELETE_STORE', name: selectedStore });
    };

    const addDependency = (target: string) => {
        if (!selectedStore || !target) return;
        useZuiStore.getState().addDependencyEdge(selectedStore, target);
    };

    const removeDependency = (id: string) => {
        useZuiStore.getState().removeDependencyEdge(id);
    };

    const changeColor = (color: string) => {
        if (!selectedStore) return;
        const current = stores[selectedStore];
        if (!current) return;
        // 파일에 실제로 반영되기 전에 미리 반영해서 즉각적인 피드백을 준다.
        useZuiStore.getState().upsertStore(selectedStore, current.currentState, current.actions, color);
        send({ type: 'UPDATE_STORE_COLOR', name: selectedStore, color });
    };

    const selectedSnapshot = selectedStore ? stores[selectedStore] : null;

    const renderBody = () => {
        if (!selectedStore || !selectedSnapshot) {
            return <div className={styles.empty}>Select a store node to inspect its state.</div>;
        }

        const outgoingEdges = dependencyEdges.filter((edge) => edge.source === selectedStore);
        const incomingEdges = dependencyEdges.filter((edge) => edge.target === selectedStore);
        const targetOptions = Object.keys(stores).filter((name) => name !== selectedStore);

        return (
            <div className={styles.body}>
                <div className={styles.section}>
                    <span className={styles.storeName}>{selectedStore}</span>
                    <div className={styles.swatchRow}>
                        {STORE_COLOR_PALETTE.map((color) => (
                            <button
                                key={color}
                                type="button"
                                aria-label={color}
                                className={`${styles.swatch} ${swatchColors[color]} ${selectedSnapshot.color === color ? styles.swatchSelected : ''}`}
                                onClick={() => changeColor(color)}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <span className={styles.sectionTitle}>State</span>
                    <JsonTree data={selectedSnapshot.currentState as Record<string, unknown>} onEdit={editStateField} />
                </div>

                <div className={styles.actionsRow}>
                    <button className={styles.btn} onClick={resetStore}>Reset</button>
                    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteStoreHandler}>Delete</button>
                </div>

                <div className={styles.section}>
                    <span className={styles.sectionTitle}>Dependencies</span>
                    <select className={styles.select} value="" onChange={(e) => addDependency(e.target.value)}>
                        <option value="">depends on...</option>
                        {targetOptions.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <div className={styles.edgeList}>
                        {outgoingEdges.map((edge) => (
                            <div className={styles.edgeRow} key={edge.id}>
                                <span>→ depends on {edge.target}</span>
                                <button className={styles.edgeRemove} onClick={() => removeDependency(edge.id)}>Remove</button>
                            </div>
                        ))}
                        {incomingEdges.map((edge) => (
                            <div className={styles.edgeRow} key={edge.id}>
                                <span>← {edge.source} depends on this</span>
                                <button className={styles.edgeRemove} onClick={() => removeDependency(edge.id)}>Remove</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.wrap}>
            <button className={styles.toggle} onClick={() => setIsOpen((v) => !v)}>
                {isOpen ? '▶' : '◀'}
            </button>
            <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
                {renderBody()}
            </div>
        </div>
    );
}

export default InspectorPanel;
