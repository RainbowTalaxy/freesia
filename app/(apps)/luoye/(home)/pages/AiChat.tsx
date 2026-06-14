'use client';
import ChatPanel from '../../components/ChatPanel';
import styles from '../../styles/home.module.css';

const AiChat = () => {
    return (
        <div className={styles.aiChat}>
            <ChatPanel
                showCloseButton={false}
                syncSessionPath
            />
        </div>
    );
};

export default AiChat;
