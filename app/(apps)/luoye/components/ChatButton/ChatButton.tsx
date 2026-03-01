'use client';
import { useContext } from 'react';
import { DocContext } from '../../doc/[docId]/context';
import styles from './ChatButton.module.css';

const ChatButton = () => {
    const { userId, isChatVisible, setChatVisible } = useContext(DocContext);

    if (!userId || isChatVisible) return null;

    return (
        <>
            <div className={styles.placeholder}></div>
            <button className={styles.chatButton} onClick={() => setChatVisible(true)}>
                与 AI 聊天
            </button>
        </>
    );
};

export default ChatButton;
