import Placeholder from '../../components/PlaceHolder';
import styles from '../../styles/document.module.css';

export default function Loading() {
    return (
        <div className={styles.docView}>
            <header className={styles.docNavBar}>
                <div className={styles.docNavTitle}>
                    <Placeholder>加载中...</Placeholder>
                </div>
            </header>
        </div>
    );
}
