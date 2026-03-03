import styles from './ChatPanel.module.css';

const MessageLoading = () => {
    return (
        <div className={styles.loading}>
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
            <div className={styles.loadingDot} />
        </div>
    );
};

export default MessageLoading;
