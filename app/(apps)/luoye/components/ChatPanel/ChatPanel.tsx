'use client';
import { useContext, useState, useRef, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SVG from '../SVG';
import { DocContext } from '../../doc/[docId]/context';
import styles from './ChatPanel.module.css';
import Toast from '../Notification/Toast';
import API, { clientFetch } from '@/api';
import { ChatSession } from '@/api/types/luoye';
import { BASE_PATH } from '@/constants';
import { AssistantChatMessage, ChatImageAttachment, Message, SseEventData, ToolCallMessage } from '../../ai/chat/types';
import { generateMessageId } from '../../ai/chat/utils';
import ChatSessionPopover from './ChatSessionPopover';
import ChatInput from './ChatInput';
import ChatMessageList from './ChatMessageList';
import { useChatAttachments } from './useChatAttachments';
import { convertSessionToMessages } from './utils';

function toSerializableAttachments(attachments: ChatImageAttachment[]) {
    return attachments.map(({ id, url, name, mimeType, size }) => ({
        id,
        url,
        name,
        mimeType,
        size,
    }));
}

interface ChatPanelProps {
    /** 是否显示关闭按钮，默认 true */
    showCloseButton?: boolean;
    /** 是否把当前会话同步到 `/luoye/ai-chat/:id` 路径 */
    syncSessionPath?: boolean;
}

const AI_CHAT_PATH = '/luoye/ai-chat';

function normalizePathname(pathname: string) {
    if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
        return pathname.slice(BASE_PATH.length) || '/';
    }
    return pathname;
}

function getAiChatSessionIdFromPathname(pathname: string) {
    const normalizedPathname = normalizePathname(pathname);
    const match = normalizedPathname.match(/^\/luoye\/ai-chat\/([^/]+)$/);
    if (!match) return null;

    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

const ChatPanel = ({
    showCloseButton = true,
    syncSessionPath = false,
}: ChatPanelProps = {}) => {
    const { setChatVisible, doc } = useContext(DocContext);
    const pathname = usePathname();
    const panelRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [pendingMessages, setPendingMessages] = useState<Array<AssistantChatMessage | ToolCallMessage>>([]);
    const {
        attachments,
        clearAttachments,
        fileInputRef,
        handleAttachmentChange,
        handleAttachmentDragEnter,
        handleAttachmentDragLeave,
        handleAttachmentDragOver,
        handleAttachmentDrop,
        isDraggingAttachment,
        isUploadingAttachment,
        removeAttachment,
        setAttachments,
    } = useChatAttachments();
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoringSession, setRestoringSession] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isHistoryOpen, setHistoryOpen] = useState(false);
    const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const pendingSelectedSessionRef = useRef<ChatSession | null>(null);
    const scrollTimerRef = useRef<number | null>(null);
    const messageListRef = useRef<HTMLDivElement>(null);
    const userScrolledRef = useRef(false);
    const lastScrollTopRef = useRef(0);
    const [pathSessionId, setPathSessionId] = useState(() => getAiChatSessionIdFromPathname(pathname));
    const previousPathSessionIdRef = useRef(pathSessionId);

    const boundSessionId = syncSessionPath ? pathSessionId : null;
    const isSessionBindingPending =
        !!boundSessionId && !doc?.id && sessionId !== boundSessionId;
    const isSessionRestoring = isRestoringSession || isSessionBindingPending;
    const isBusy = isLoading || isSessionRestoring;

    const replaceSessionPath = useCallback(
        (nextSessionId: string | null) => {
            if (!syncSessionPath) return;
            setPathSessionId(nextSessionId);
            if (typeof window === 'undefined') return;
            window.history.replaceState(
                window.history.state,
                '',
                nextSessionId
                    ? `${BASE_PATH}${AI_CHAT_PATH}/${encodeURIComponent(nextSessionId)}`
                    : `${BASE_PATH}${AI_CHAT_PATH}`,
            );
        },
        [syncSessionPath],
    );

    useEffect(() => {
        if (!syncSessionPath) return;
        setPathSessionId(getAiChatSessionIdFromPathname(pathname));
    }, [pathname, syncSessionPath]);

    useEffect(() => {
        if (!syncSessionPath || typeof window === 'undefined') return;

        const handlePopState = () => {
            setPathSessionId(getAiChatSessionIdFromPathname(window.location.pathname));
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [syncSessionPath]);

    const scrollToBottom = useCallback((force = false) => {
        if (force) {
            userScrolledRef.current = false;
            if (scrollTimerRef.current) {
                cancelAnimationFrame(scrollTimerRef.current);
                scrollTimerRef.current = null;
            }
        } else if (userScrolledRef.current) {
            return;
        }

        if (scrollTimerRef.current) return;

        scrollTimerRef.current = requestAnimationFrame(() => {
            scrollTimerRef.current = null;
            if (!messageListRef.current) return;
            // Double check: if user scrolled up while waiting for RAF, don't auto scroll unless forced
            if (!force && userScrolledRef.current) return;

            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        });
    }, []);

    useEffect(() => {
        const previousPathSessionId = previousPathSessionIdRef.current;
        previousPathSessionIdRef.current = pathSessionId;

        if (!syncSessionPath || doc?.id || boundSessionId) return;
        if (!previousPathSessionId) return;

        setMessages([]);
        setPendingMessages([]);
        setInput('');
        pendingSelectedSessionRef.current = null;
        clearAttachments({ revokeAll: true });
        setSessionId(null);
        userScrolledRef.current = false;
        scrollToBottom(true);
    }, [
        boundSessionId,
        clearAttachments,
        doc?.id,
        pathSessionId,
        scrollToBottom,
        syncSessionPath,
    ]);

    const handleScroll = useCallback(() => {
        const container = messageListRef.current;
        if (!container) return;

        // 我们已经通过滚动方向判断用户意图，所以不再需要宽泛的阈值
        // 这里仅保留微小的容差以处理高分屏缩放导致的浮点数误差
        const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10;

        // 如果用户已经在底部，重置滚动标记
        if (isAtBottom) {
            userScrolledRef.current = false;
        } else if (container.scrollTop < lastScrollTopRef.current) {
            // 只有当用户向上滚动时，才标记为手动滚动
            userScrolledRef.current = true;
        }

        lastScrollTopRef.current = container.scrollTop;
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, pendingMessages, scrollToBottom]);

    // 监听消息列表 DOM 变化（主要是 Typewriter 打字动画驱动的内容增长），
    // 以便在内容高度变化时也能自动滚到底部。
    // scrollToBottom 内部有 RAF 节流，不会过度触发。
    useEffect(() => {
        const container = messageListRef.current;
        if (!container) return;

        const observer = new MutationObserver(() => {
            scrollToBottom();
        });

        observer.observe(container, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [scrollToBottom]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (scrollTimerRef.current) {
                cancelAnimationFrame(scrollTimerRef.current);
            }
        };
    }, []);

    const handleAbort = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        setPendingMessages([]);

        if (sessionId) {
            try {
                await clientFetch(API.luoye.ai.chat.abort(sessionId));
            } catch (error) {
                console.error('Failed to abort session on server', error);
            }
        }
    }, [sessionId]);

    const handleNewSession = useCallback(() => {
        if (isLoading) {
            Toast.notify('请先停止当前回复，再新建会话');
            return;
        }
        setMessages([]);
        setPendingMessages([]);
        setInput('');
        pendingSelectedSessionRef.current = null;
        clearAttachments({ revokeAll: true });
        setSessionId(null);
        replaceSessionPath(null);
        setHistoryOpen(false);
        userScrolledRef.current = false;
        scrollToBottom(true);
    }, [clearAttachments, isLoading, replaceSessionPath, scrollToBottom]);

    const applySession = useCallback(
        (session: ChatSession) => {
            setSessionId(session.sessionId);
            setMessages(convertSessionToMessages(session));
            setPendingMessages([]);
            setInput('');
            clearAttachments({ revokeAll: true });
            userScrolledRef.current = false;
            scrollToBottom(true);
        },
        [clearAttachments, scrollToBottom],
    );

    const handleSessionSelect = useCallback(
        (session: ChatSession) => {
            if (
                syncSessionPath &&
                boundSessionId &&
                session.sessionId !== boundSessionId
            ) {
                pendingSelectedSessionRef.current = session;
                replaceSessionPath(session.sessionId);
                return;
            }
            replaceSessionPath(session.sessionId);
            applySession(session);
        },
        [applySession, boundSessionId, replaceSessionPath, syncSessionPath],
    );

    useEffect(() => {
        if (!boundSessionId || doc?.id) return;
        if (sessionId === boundSessionId) return;
        if (abortControllerRef.current) return;

        const pendingSelectedSession = pendingSelectedSessionRef.current;
        if (pendingSelectedSession?.sessionId === boundSessionId) {
            pendingSelectedSessionRef.current = null;
            applySession(pendingSelectedSession);
            return;
        }

        let cancelled = false;
        setRestoringSession(true);
        clientFetch(API.luoye.ai.chat.getSession(boundSessionId))
            .then((session) => {
                if (cancelled) return;
                applySession(session);
            })
            .catch((error) => {
                if (cancelled) return;
                Toast.notify(
                    error instanceof Error
                        ? error.message
                        : '恢复历史会话失败',
                );
                replaceSessionPath(null);
            })
            .finally(() => {
                if (!cancelled) setRestoringSession(false);
            });

        return () => {
            cancelled = true;
        };
    }, [
        boundSessionId,
        doc?.id,
        applySession,
        replaceSessionPath,
        sessionId,
    ]);

    const handleSend = useCallback(
        async (userInput: string) => {
            if (isUploadingAttachment) {
                Toast.notify('图片还在上传中，请稍后发送');
                return;
            }
            if ((!userInput.trim() && attachments.length === 0) || abortControllerRef.current || isSessionRestoring)
                return;

            const displayAttachments = attachments;
            const selectedAttachments = toSerializableAttachments(attachments);

            const userMessage: Message = {
                id: generateMessageId(),
                role: 'user',
                content: userInput,
                ...(displayAttachments.length ? { attachments: displayAttachments } : {}),
                createdAt: Date.now(),
            };

            // 提交用户消息
            setMessages((prev) => [...prev, userMessage]);
            setInput('');
            clearAttachments({ preservePreviews: true });
            setIsLoading(true);
            setPendingMessages([]);
            scrollToBottom(true);

            abortControllerRef.current = new AbortController();

            try {
                const response = await clientFetch(
                    API.luoye.ai.chat.send({
                        ...(doc?.id ? { docId: doc.id } : {}),
                        message: userMessage.content,
                        ...(selectedAttachments.length ? { attachments: selectedAttachments } : {}),
                        sessionId: sessionId || undefined,
                    }),
                    abortControllerRef.current,
                    { keepResponse: true },
                );

                if (!response.ok) {
                    let errorMessage = '请求失败';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch {
                        /* ignore */
                    }
                    throw new Error(errorMessage);
                }

                if (!response.body) throw new Error('No response body');

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                const _pendingMessages: Array<AssistantChatMessage | ToolCallMessage> = [];
                let pendingAssistantChatMessage: AssistantChatMessage | null = null;
                let pendingToolCallMessages: Map<string, ToolCallMessage> = new Map(); // <run_id, ToolCallMessage>
                let receivedTerminalEvent = false;

                const processSSELine = (line: string) => {
                    if (!line.startsWith('data: ')) return;
                    try {
                        const data = JSON.parse(line.slice(6)) as SseEventData;
                        switch (data.type) {
                            case 'session': {
                                setSessionId(data.sessionId);
                                replaceSessionPath(data.sessionId);
                                break;
                            }
                            case 'message': {
                                if (!pendingAssistantChatMessage) {
                                    pendingAssistantChatMessage = {
                                        id: data.messageId,
                                        role: 'assistant',
                                        content: data.content,
                                        createdAt: Date.now(),
                                    };
                                } else if (pendingAssistantChatMessage.id === data.messageId) {
                                    pendingAssistantChatMessage.content += data.content;
                                } else {
                                    if (pendingAssistantChatMessage.content.trim()) {
                                        _pendingMessages.push(pendingAssistantChatMessage);
                                    }
                                    pendingAssistantChatMessage = {
                                        id: data.messageId,
                                        role: 'assistant',
                                        content: data.content,
                                        createdAt: Date.now(),
                                    };
                                }
                                setPendingMessages([..._pendingMessages, { ...pendingAssistantChatMessage }]);
                                break;
                            }
                            case 'tool_start': {
                                if (pendingAssistantChatMessage) {
                                    if (pendingAssistantChatMessage.content.trim()) {
                                        _pendingMessages.push(pendingAssistantChatMessage);
                                    }
                                    pendingAssistantChatMessage = null;
                                }
                                const toolMessage: ToolCallMessage = {
                                    run_id: data.run_id,
                                    role: 'tool',
                                    name: data.name,
                                    input: data.input,
                                };
                                pendingToolCallMessages.set(data.run_id, toolMessage);
                                setPendingMessages([
                                    ..._pendingMessages,
                                    ...Array.from(pendingToolCallMessages.values()),
                                ]);
                                break;
                            }
                            case 'tool_end': {
                                const toolMessage: ToolCallMessage = {
                                    run_id: data.run_id,
                                    role: 'tool',
                                    name: data.name,
                                    input: data.input,
                                    content: data.content,
                                };
                                pendingToolCallMessages.delete(data.run_id);
                                _pendingMessages.push(toolMessage);
                                setPendingMessages([
                                    ..._pendingMessages,
                                    ...Array.from(pendingToolCallMessages.values()),
                                ]);
                                break;
                            }
                            case 'done':
                                receivedTerminalEvent = true;
                                if (pendingAssistantChatMessage) {
                                    if (pendingAssistantChatMessage.content.trim()) {
                                        _pendingMessages.push(pendingAssistantChatMessage);
                                    }
                                    pendingAssistantChatMessage = null;
                                }
                                if (pendingToolCallMessages.size > 0) {
                                    _pendingMessages.push(...Array.from(pendingToolCallMessages.values()));
                                    pendingToolCallMessages.clear();
                                }
                                setPendingMessages([]);
                                if (_pendingMessages.length > 0) {
                                    setMessages((prev) => [
                                        ...prev,
                                        {
                                            id: data.messageId,
                                            role: 'assistant',
                                            content: _pendingMessages,
                                            createdAt: Date.now(),
                                        },
                                    ]);
                                }
                                setSessionRefreshKey((prev) => prev + 1);
                                setIsLoading(false);
                                abortControllerRef.current = null;
                                break;
                            case 'error':
                                receivedTerminalEvent = true;
                                if (pendingAssistantChatMessage) {
                                    if (pendingAssistantChatMessage.content.trim()) {
                                        _pendingMessages.push(pendingAssistantChatMessage);
                                    }
                                    pendingAssistantChatMessage = null;
                                }
                                if (pendingToolCallMessages.size > 0) {
                                    _pendingMessages.push(...Array.from(pendingToolCallMessages.values()));
                                    pendingToolCallMessages.clear();
                                }
                                // 将错误作为独立块追加到消息列表末尾
                                _pendingMessages.push({
                                    id: generateMessageId(),
                                    role: 'assistant',
                                    content: `错误：${data.message}`,
                                    createdAt: Date.now(),
                                });
                                setPendingMessages([]);
                                setMessages((prev) => [
                                    ...prev,
                                    {
                                        id: generateMessageId(),
                                        role: 'assistant',
                                        content: _pendingMessages,
                                        createdAt: Date.now(),
                                    },
                                ]);
                                setSessionRefreshKey((prev) => prev + 1);
                                setIsLoading(false);
                                abortControllerRef.current = null;
                                break;
                        }
                    } catch (e) {
                        console.error('Failed to parse SSE data', e);
                    }
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        processSSELine(line);
                    }
                }

                // 处理 buffer 中可能残留的最后一条 SSE 事件
                if (buffer.trim()) {
                    processSSELine(buffer);
                }

                // 防御：流正常结束但未收到 done/error 事件（如服务端提前关闭连接）
                if (abortControllerRef.current && !receivedTerminalEvent) {
                    const interruptedMessage: AssistantChatMessage = {
                        id: generateMessageId(),
                        role: 'assistant',
                        content: '连接已中断，以下回答可能不完整，请重试。',
                        createdAt: Date.now(),
                    };

                    if (_pendingMessages.length > 0) {
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: generateMessageId(),
                                role: 'assistant',
                                content: [..._pendingMessages, interruptedMessage],
                                createdAt: Date.now(),
                            },
                        ]);
                    } else {
                        setMessages((prev) => [
                            ...prev,
                            {
                                id: generateMessageId(),
                                role: 'assistant',
                                content: [interruptedMessage],
                                createdAt: Date.now(),
                            },
                        ]);
                    }
                    Toast.notify('连接中断，回答可能不完整，请重试');
                    setPendingMessages([]);
                    setIsLoading(false);
                    abortControllerRef.current = null;
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    // Handled in handleAbort
                    return;
                }
                console.error('Chat error:', error);
                Toast.notify(error instanceof Error ? error.message : '发送失败');
                setMessages((prev) => prev.filter((item) => item.id !== userMessage.id));
                setInput(userInput);
                setAttachments(displayAttachments);
                setPendingMessages([]);
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        },
        [attachments, clearAttachments, doc?.id, isSessionRestoring, isUploadingAttachment, replaceSessionPath, sessionId, scrollToBottom, setAttachments],
    );

    return (
        <div className={styles.container} ref={panelRef}>
            <div className={styles.toolbar}>
                <div className={styles.toolbarLeft}>
                    {showCloseButton && (
                        <button
                            className={styles.closeButton}
                            onClick={() => setChatVisible(false)}
                            aria-label="关闭聊天"
                        >
                            <SVG.LeftArrow />
                        </button>
                    )}
                </div>
                <div className={styles.toolbarActions}>
                    <button
                        className={styles.closeButton}
                        type="button"
                        onClick={handleNewSession}
                        aria-label="新建会话"
                    >
                        <SVG.MessageCirclePlus />
                    </button>
                    <ChatSessionPopover
                        docId={doc?.id}
                        currentSessionId={sessionId}
                        isOpen={isHistoryOpen}
                        isChatLoading={isBusy}
                        refreshKey={sessionRefreshKey}
                        onToggle={() => setHistoryOpen((prev) => !prev)}
                        onClose={() => setHistoryOpen(false)}
                        onSessionSelect={handleSessionSelect}
                        onRestoreStart={() => setRestoringSession(true)}
                        onRestoreEnd={() => setRestoringSession(false)}
                    />
                </div>
            </div>
            <div className={styles.content}>
                <ChatMessageList
                    docId={doc?.id}
                    isLoading={isLoading || isSessionBindingPending}
                    messages={isSessionBindingPending ? [] : messages}
                    messageListRef={messageListRef}
                    onScroll={handleScroll}
                    pendingMessages={isSessionBindingPending ? [] : pendingMessages}
                    sessionId={sessionId}
                />
                <ChatInput
                    attachments={attachments}
                    fileInputRef={fileInputRef}
                    input={input}
                    isDraggingAttachment={isDraggingAttachment}
                    isLoading={isLoading}
                    isRestoringSession={isSessionRestoring}
                    isUploadingAttachment={isUploadingAttachment}
                    onAbort={handleAbort}
                    onAttachmentChange={handleAttachmentChange}
                    onAttachmentDragEnter={handleAttachmentDragEnter}
                    onAttachmentDragLeave={handleAttachmentDragLeave}
                    onAttachmentDragOver={handleAttachmentDragOver}
                    onAttachmentDrop={handleAttachmentDrop}
                    onInputChange={setInput}
                    onRemoveAttachment={removeAttachment}
                    onSend={handleSend}
                />
            </div>
        </div>
    );
};

export default ChatPanel;
