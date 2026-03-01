'use client';
import { useContext, useState, useRef, useCallback } from 'react';
import SVG from '../SVG';
import { DocContext } from '../../doc/[docId]/context';
import styles from './ChatPanel.module.css';
import { Button, TextArea } from '@/components/form';

const ChatPanel = () => {
    const { setChatVisible } = useContext(DocContext);
    const panelRef = useRef<HTMLDivElement>(null);

    return (
        <div className={styles.container} ref={panelRef}>
            <button className={styles.closeButton} onClick={() => setChatVisible(false)} aria-label="关闭聊天">
                <SVG.LeftArrow />
            </button>
            <div className={styles.content}>
                <div className={styles.inputActions}>
                    <TextArea
                        name="chat-box"
                        className={styles.chatBox}
                        placeholder="请输入你想问的问题（Shift+Enter 换行）"
                    />
                    <Button className={styles.sendButton} type="primary">
                        发 送
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
