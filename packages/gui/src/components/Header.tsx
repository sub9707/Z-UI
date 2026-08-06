import logo from '../assets/zui-logo.png';
import styles from './Header.module.css';

type HeaderProps = {
    status: string;
    storeCount: number;
};

function Header({ status, storeCount }: HeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.brand}>
                <img className={styles.logo} src={logo} alt="Z-UI" />
                <span className={styles.title}>GUI for Zustand</span>
            </div>
            <div className={styles.meta}>
                <span className={styles.storeCount}>{storeCount} stores</span>
                <span className={styles.statusPill}>
                    <span className={styles.dot} data-status={status} />
                    {status}
                </span>
            </div>
        </header>
    );
}

export default Header;
