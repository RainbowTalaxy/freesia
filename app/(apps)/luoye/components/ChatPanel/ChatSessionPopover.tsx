'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import API, { clientFetch } from '@/api';
import { ChatSession, ChatSessionSummary } from '@/api/types/luoye';
import Toast from '../Notification/Toast';
import SVG from '../SVG';
import styles from './ChatSessionPopover.module.css';

interface Props {
    docId?: string;
    currentSessionId: string | null;
    isOpen: boolean;
    isChatLoading: boolean;
    refreshKey: number;
    onToggle: () => void;
    onClose: () => void;
    onSessionSelect: (session: ChatSession) => void;
    onRestoreStart?: () => void;
    onRestoreEnd?: () => void;
}

function formatTime(value: number) {
    const date = new Date(value);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return date.toLocaleString('zh-CN', {
        month: isToday ? undefined : '2-digit',
        day: isToday ? undefined : '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

const ChatSessionPopover = ({
    docId,
    currentSessionId,
    isOpen,
    isChatLoading,
    refreshKey,
    onToggle,
    onClose,
    onSessionSelect,
    onRestoreStart,
    onRestoreEnd,
}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const loadedQueryRef = useRef<string | null>(null);
    const requestIdRef = useRef(0);
    const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
    const [isLoading, setLoading] = useState(false);
    const queryKey = docId ?? '__all__';

    const loadSessions = useCallback(async () => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        const isLoadedQuery = loadedQueryRef.current === queryKey;

        setLoading(!isLoadedQuery);
        if (!isLoadedQuery) {
            setSessions([]);
        }

        try {
            const result = await clientFetch(
                API.luoye.ai.chat.listSessions({
                    ...(docId ? { docId } : {}),
                    limit: 20,
                }),
            );
            if (requestIdRef.current !== requestId) return;
            loadedQueryRef.current = queryKey;
            setSessions(result);
        } catch (error) {
            if (requestIdRef.current !== requestId) return;
            if (!isLoadedQuery) {
                setSessions([]);
            }
            Toast.notify(error instanceof Error ? error.message : '获取历史会话失败');
        } finally {
            if (requestIdRef.current === requestId) {
                setLoading(false);
            }
        }
    }, [docId, queryKey]);

    useEffect(() => {
        if (isOpen) loadSessions();
    }, [isOpen, loadSessions, refreshKey]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleSelect = async (sessionId: string) => {
        if (isChatLoading) {
            Toast.notify('请先停止当前回复，再切换历史会话');
            return;
        }
        onRestoreStart?.();
        try {
            const session = await clientFetch(API.luoye.ai.chat.getSession(sessionId));
            onSessionSelect(session);
            onClose();
        } catch (error) {
            Toast.notify(error instanceof Error ? error.message : '恢复历史会话失败');
        } finally {
            onRestoreEnd?.();
        }
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <button className={styles.trigger} type="button" onClick={onToggle} aria-label="历史对话">
                <SVG.History />
            </button>
            {isOpen && (
                <div className={styles.popover}>
                    <div className={styles.header}>历史对话</div>
                    {isLoading ? (
                        <div className={styles.state}>加载中...</div>
                    ) : sessions.length === 0 ? (
                        <div className={styles.state}>暂无历史会话</div>
                    ) : (
                        <div className={styles.list}>
                            {sessions.map((session) => (
                                <div
                                    key={session.sessionId}
                                    className={`${styles.item} ${
                                        session.sessionId === currentSessionId ? styles.active : ''
                                    }`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleSelect(session.sessionId)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            handleSelect(session.sessionId);
                                        }
                                    }}
                                >
                                    <span className={styles.title}>{session.title || '新会话'}</span>
                                    <span className={styles.time}>
                                        <span className={styles.meta}>{formatTime(session.updatedAt)}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatSessionPopover;
