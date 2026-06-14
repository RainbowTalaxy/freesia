import styles from './ChatPanel.module.css';

interface Props {
    docId?: string;
}

const Welcome = ({ docId }: Props) => {
    return (
        <div className={styles.welcome}>
            <div className={styles.welcomeTitle}>我是 🍂 落页文档助手</div>
            <div className={styles.welcomeDesc}>
                {docId ? '我已阅读你的文档内容，请随时向我提问 ^_^' : '任何文档相关的问题，都可以向我提问 ^_^'}
            </div>
        </div>
    );
};

export default Welcome;
