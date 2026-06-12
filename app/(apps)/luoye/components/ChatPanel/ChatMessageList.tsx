'use client';
/* eslint-disable @next/next/no-img-element */

import type { RefObject } from 'react';
import type { AssistantChatMessage, Message, ToolCallMessage } from '../../ai/chat/types';
import AssistantContent from './AssistantContent';
import MessageLoading from './MessageLoading';
import Welcome from './Welcome';
import styles from './ChatPanel.module.css';

interface ChatMessageListProps {
    docId?: string;
    isLoading: boolean;
    messages: Message[];
    messageListRef: RefObject<HTMLDivElement>;
    onScroll: () => void;
    pendingMessages: Array<AssistantChatMessage | ToolCallMessage>;
    sessionId: string | null;
}

export default function ChatMessageList({
    docId,
    isLoading,
    messages,
    messageListRef,
    onScroll,
    pendingMessages,
    sessionId,
}: ChatMessageListProps) {
    return (
        <div className={styles.messageList} ref={messageListRef} onScroll={onScroll}>
            {messages.length === 0 && !isLoading ? (
                <Welcome docId={docId} />
            ) : (
                <>
                    {messages.map((msg) => {
                        const isUserMessage = msg.role === 'user';
                        return (
                            <div
                                key={msg.id}
                                className={`${styles.message} ${
                                    isUserMessage ? styles.userMessage : styles.assistantMessage
                                }`}
                            >
                                <div className={styles.messageContent}>
                                    {msg.role === 'assistant' ? (
                                        <AssistantContent content={msg.content} sessionId={sessionId} />
                                    ) : (
                                        <>
                                            {msg.content}
                                            {!!msg.attachments?.length && (
                                                <div className={styles.messageAttachments}>
                                                    {msg.attachments.map((attachment) => (
                                                        <a
                                                            className={styles.messageAttachment}
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            key={attachment.id}
                                                        >
                                                            <img
                                                                src={attachment.previewUrl || attachment.url}
                                                                alt={attachment.name}
                                                            />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                {isUserMessage && <div className={styles.avatar}>🐰</div>}
                                {!isUserMessage && <MessageLoading visible={false} />}
                            </div>
                        );
                    })}
                    {isLoading && (
                        <div className={`${styles.message} ${styles.assistantMessage}`}>
                            <div className={styles.messageContent}>
                                <AssistantContent content={pendingMessages} sessionId={sessionId} />
                            </div>
                            <MessageLoading visible />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
