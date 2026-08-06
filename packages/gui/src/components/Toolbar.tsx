import { useState } from 'react';
import StoreChips from './StoreChips';
import StoreCreateForm from './StoreCreateForm';
import SnapshotPanel from './SnapshotPanel';
import styles from './Toolbar.module.css';

type ToolbarProps = {
    send: (message: unknown) => void;
};

type SectionKey = 'create' | 'snapshots';

function Toolbar({ send }: ToolbarProps) {
    const [openSection, setOpenSection] = useState<SectionKey | null>(null);

    const toggleSection = (key: SectionKey) => {
        setOpenSection((current) => (current === key ? null : key));
    };

    return (
        <div className={styles.toolbar}>
            <div className={styles.section}>
                <div className={styles.storesSectionBody}>
                    <StoreChips />
                </div>
            </div>

            <div className={styles.section}>
                <button className={styles.sectionHeader} onClick={() => toggleSection('create')}>
                    New Store
                    <span className={`${styles.chevron} ${openSection === 'create' ? styles.chevronOpen : ''}`}>›</span>
                </button>
                {openSection === 'create' && (
                    <div className={styles.sectionBody}>
                        <StoreCreateForm send={send} />
                    </div>
                )}
            </div>

            <div className={styles.section}>
                <button className={styles.sectionHeader} onClick={() => toggleSection('snapshots')}>
                    Snapshots
                    <span className={`${styles.chevron} ${openSection === 'snapshots' ? styles.chevronOpen : ''}`}>›</span>
                </button>
                {openSection === 'snapshots' && (
                    <div className={styles.sectionBody}>
                        <SnapshotPanel send={send} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Toolbar;
