'use client';
import { useContext, useState, useRef, useCallback, useEffect } from 'react';
import SVG from '../SVG';
import { DocContext } from '../../doc/[docId]/context';
import styles from './ChatPanel.module.css';
import { Button, TextArea } from '@/components/form';
import Markdown from '../Markdown';
import Toast from '../Notification/Toast';
import API, { clientFetch } from '@/api';
import MessageLoading from './MessageLoading';
import Welcome from './Welcome';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
}

const ChatPanel = () => {
    const { setChatVisible, doc } = useContext(DocContext);
    const panelRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const isComposingRef = useRef(false);
    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messageListRef = useRef<HTMLDivElement>(null);
    const userScrolledRef = useRef(false);

    const scrollToBottom = useCallback((force?: boolean) => {
        if (!force && userScrolledRef.current) return;
        if (scrollTimerRef.current) return;
        scrollTimerRef.current = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            scrollTimerRef.current = null;
        }, 100);
    }, []);

    const handleScroll = useCallback(() => {
        const el = messageListRef.current;
        if (!el) return;
        // 距离底部 50px 以内认为在底部
        const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
        userScrolledRef.current = !isAtBottom;
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const removeEmptyAssistantMessage = useCallback(() => {
        setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && !last.content.trim()) {
                return prev.slice(0, -1);
            }
            return prev;
        });
    }, []);

    const handleAbort = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        removeEmptyAssistantMessage();

        if (sessionId) {
            try {
                await clientFetch(API.luoye.ai.chat.abort(sessionId));
            } catch (error) {
                console.error('Failed to abort session on server', error);
            }
        }
    }, [sessionId, removeEmptyAssistantMessage]);

    const handleSend = useCallback(
        async (userInput: string) => {
            if (!userInput.trim() || !doc?.id || abortControllerRef.current) return;

            const userMessage: Message = {
                id: crypto.randomUUID(),
                role: 'user',
                content: userInput,
                createdAt: Date.now(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setInput('');
            setIsLoading(true);
            userScrolledRef.current = false;
            scrollToBottom(true);

            const currentAssistantMessageId = crypto.randomUUID();
            setMessages((prev) => [
                ...prev,
                {
                    id: currentAssistantMessageId,
                    role: 'assistant',
                    content: '',
                    createdAt: Date.now(),
                },
            ]);

            abortControllerRef.current = new AbortController();

            try {
                const response = await clientFetch(
                    API.luoye.ai.chat.send({
                        docId: doc.id,
                        message: userMessage.content,
                        sessionId: sessionId || undefined,
                    }),
                    abortControllerRef.current,
                    { keepResponse: true },
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '请求失败');
                }

                if (!response.body) throw new Error('No response body');

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                const processSSELine = (line: string) => {
                    if (!line.startsWith('data: ')) return;
                    try {
                        const data = JSON.parse(line.slice(6));
                        switch (data.type) {
                            case 'session':
                                setSessionId(data.sessionId);
                                break;
                            case 'message':
                                setMessages((prev) =>
                                    prev.map((msg) =>
                                        msg.id === currentAssistantMessageId
                                            ? { ...msg, content: msg.content + data.content }
                                            : msg,
                                    ),
                                );
                                break;
                            case 'done':
                                setIsLoading(false);
                                abortControllerRef.current = null;
                                break;
                            case 'error':
                                Toast.notify(data.message || '生成出错');
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
            } catch (error: any) {
                if (error.name === 'AbortError') {
                    // Handled in handleAbort
                    return;
                }
                console.error('Chat error:', error);
                Toast.notify(error.message || '发送失败');
                removeEmptyAssistantMessage();
                setIsLoading(false);
                abortControllerRef.current = null;
            }
        },
        [doc?.id, sessionId, scrollToBottom, removeEmptyAssistantMessage],
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            if (isComposingRef.current || e.nativeEvent.isComposing) return;
            e.preventDefault();
            handleSend(input);
        }
    };

    return (
        <div className={styles.container} ref={panelRef}>
            <button className={styles.closeButton} onClick={() => setChatVisible(false)} aria-label="关闭聊天">
                <SVG.LeftArrow />
            </button>
            <div className={styles.content}>
                <div className={styles.messageList} ref={messageListRef} onScroll={handleScroll}>
                    {messages.length === 0 ? (
                        <Welcome />
                    ) : (
                        messages.map((msg, idx) => {
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
                                            <Markdown title="">{msg.content}</Markdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    {isUserMessage && <div className={styles.avatar}>🐰</div>}
                                    {!isUserMessage && idx === messages.length - 1 && isLoading && <MessageLoading />}
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className={styles.inputActions}>
                    <TextArea
                        name="chat-box"
                        className={styles.chatBox}
                        placeholder="请输入你想问的问题（Shift+Enter 换行）"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onCompositionStart={() => (isComposingRef.current = true)}
                        onCompositionEnd={() => (isComposingRef.current = false)}
                        onKeyDown={handleKeyDown}
                    />
                    <Button
                        className={styles.sendButton}
                        type="primary"
                        onClick={isLoading ? handleAbort : () => handleSend(input)}
                    >
                        {isLoading ? '停 止' : '发 送'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
