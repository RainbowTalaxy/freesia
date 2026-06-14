import clsx from 'clsx';
import styles from './ChatPanel.module.css';

interface Props {
    visible?: boolean;
}

const MessageLoading = ({ visible = true }: Props) => {
    return (
        <div className={clsx(styles.loading, !visible && styles.hidden)}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
        </div>
    );
};

export default MessageLoading;
