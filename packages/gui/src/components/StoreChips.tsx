import type { CSSProperties } from 'react';
import { useZuiStore } from '../store/zuiStore';
import { resolveStoreColor } from '../utils/colors';
import styles from './StoreChips.module.css';

function StoreChips() {
    const stores = useZuiStore((s) => s.stores);
    const selectedStore = useZuiStore((s) => s.selectedStore);
    const storeNames = Object.keys(stores);

    if (storeNames.length === 0) {
        return <div className={styles.empty}>No stores registered yet.</div>;
    }

    return (
        <div className={styles.list}>
            {storeNames.map((name) => (
                <button
                    key={name}
                    className={`${styles.chip} ${name === selectedStore ? styles.chipActive : ''}`}
                    style={{ '--chip-color': resolveStoreColor(stores[name]?.color) } as CSSProperties}
                    onClick={() => useZuiStore.getState().selectStore(name)}
                >
                    <span className={styles.dot} />
                    {name}
                </button>
            ))}
        </div>
    );
}

export default StoreChips;
