import styles from './ChatPanel.module.css';

const Welcome = () => {
    return (
        <div className={styles.welcome}>
            <div className={styles.welcomeTitle}>我是 🍂 落页文档助手</div>
            <div className={styles.welcomeDesc}>我已阅读你的文档内容，请随时向我提问 ^_^</div>
        </div>
    );
};

export default Welcome;
