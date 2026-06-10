import path from 'path';
import FileHandler from '../FileHandler';
import { AIMessage, HumanMessage, ToolMessage } from 'langchain';

/** 聊天会话数据存储根目录 */
const CHAT_DIR = path.join(process.cwd(), 'temp/luoye/chat');

/** 会话最大数量 */
const MAX_SESSIONS = 10;

/** 会话过期时间（7 天） */
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

const CHAT_SESSION_SCHEMA_VERSION = 1;
const DEFAULT_SESSION_TITLE = '新会话';
const DEFAULT_SESSION_LIMIT = 20;

interface ChatSessionUserChatMessage {
    messageId: string;
    role: 'user';
    content: string;
    createdAt: number;
}

export interface ChatSessionAssistantChatMessage {
    messageId: string;
    role: 'assistant';
    content: string;
    toolCalls?: Array<{
        id: string;
        name: string;
        args: Record<string, unknown>;
    }>;
    createdAt: number;
}

export interface ChatSessionToolCallMessage {
    toolCallId: string;
    runId: string;
    role: 'tool';
    name: string;
    args: Record<string, unknown>;
    input: string;
    output: string;
    content: string;
    createdAt: number;
}

interface ChatSessionAssistantMessage {
    messageId: string;
    role: 'assistant';
    content: Array<
        ChatSessionAssistantChatMessage | ChatSessionToolCallMessage
    >;
    createdAt: number;
}

export type ChatSessionChatMessage =
    | ChatSessionUserChatMessage
    | ChatSessionAssistantMessage;

export interface ChatSession {
    schemaVersion: 1;
    sessionId: string;
    docId?: string;
    userId: string;
    title: string;
    messages: ChatSessionChatMessage[];
    docUpdatedAt?: number;
    createdAt: number;
    updatedAt: number;
}

export interface ChatSessionSummary {
    schemaVersion: 1;
    sessionId: string;
    userId: string;
    docId?: string;
    title: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
}

function userDir(userId: string) {
    return path.join(CHAT_DIR, userId);
}

function sessionFile(userId: string, sessionId: string) {
    return path.join(userDir(userId), `${sessionId}.json`);
}

function createSessionTitle(content: string) {
    const title = content.trim().replace(/\s+/g, ' ').slice(0, 20);
    return title || DEFAULT_SESSION_TITLE;
}

function getFirstUserMessage(session: Pick<ChatSession, 'messages'>) {
    return session.messages.find(
        (message): message is ChatSessionUserChatMessage =>
            message.role === 'user',
    );
}

function normalizeSession(
    session: Partial<ChatSession> & Pick<ChatSession, 'sessionId' | 'userId'>,
): ChatSession {
    const messages = session.messages ?? [];
    const firstUserMessage = getFirstUserMessage({ messages });
    return {
        schemaVersion: CHAT_SESSION_SCHEMA_VERSION,
        sessionId: session.sessionId,
        ...(session.docId ? { docId: session.docId } : {}),
        userId: session.userId,
        title:
            session.title ||
            (firstUserMessage
                ? createSessionTitle(firstUserMessage.content)
                : DEFAULT_SESSION_TITLE),
        messages,
        ...(session.docUpdatedAt !== undefined
            ? { docUpdatedAt: session.docUpdatedAt }
            : {}),
        createdAt: session.createdAt ?? Date.now(),
        updatedAt: session.updatedAt ?? Date.now(),
    };
}

function isInitialReadDocMessage(
    message: ChatSessionChatMessage,
    index: number,
) {
    if (index !== 0 || message.role !== 'assistant') return false;
    const [assistantMessage, toolMessage] = message.content;
    return (
        message.content.length === 2 &&
        assistantMessage?.role === 'assistant' &&
        assistantMessage.content === '' &&
        assistantMessage.toolCalls?.some((tool) => tool.name === 'read_doc') &&
        toolMessage?.role === 'tool' &&
        toolMessage.name === 'read_doc'
    );
}

function countVisibleMessages(messages: ChatSessionChatMessage[]) {
    return messages.filter(
        (message, index) => !isInitialReadDocMessage(message, index),
    ).length;
}

function toSessionSummary(session: ChatSession): ChatSessionSummary {
    return {
        schemaVersion: CHAT_SESSION_SCHEMA_VERSION,
        sessionId: session.sessionId,
        userId: session.userId,
        ...(session.docId ? { docId: session.docId } : {}),
        title: session.title,
        messageCount: countVisibleMessages(session.messages),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
    };
}

const ChatFile = {
    /** 创建新会话 */
    async createSession(
        userId: string,
        docId?: string,
        docUpdatedAt?: number,
    ): Promise<ChatSession> {
        const now = Date.now();
        const id = crypto.randomUUID();
        const session: ChatSession = {
            schemaVersion: CHAT_SESSION_SCHEMA_VERSION,
            sessionId: id,
            ...(docId ? { docId } : {}),
            userId,
            title: DEFAULT_SESSION_TITLE,
            messages: [],
            ...(docUpdatedAt !== undefined ? { docUpdatedAt } : {}),
            createdAt: now,
            updatedAt: now,
        };
        await FileHandler.writeJSON(sessionFile(userId, id), session);
        return session;
    },

    /** 读取会话 */
    async getSession(
        userId: string,
        sessionId: string,
    ): Promise<ChatSession | null> {
        const session = await FileHandler.readJSON<ChatSession>(
            sessionFile(userId, sessionId),
        );
        return session ? normalizeSession(session) : null;
    },

    /** 获取会话摘要列表 */
    async listSessions(
        userId: string,
        options: { docId?: string; limit?: number } = {},
    ): Promise<ChatSessionSummary[]> {
        const dir = userDir(userId);
        const files = await FileHandler.listFiles(dir);
        const sessions: ChatSession[] = [];

        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const rawSession = await FileHandler.readJSON<ChatSession>(
                path.join(dir, file),
            );
            if (!rawSession) continue;
            const session = normalizeSession(rawSession);
            if (options.docId && session.docId !== options.docId) continue;
            sessions.push(session);
        }

        const limit = options.limit ?? DEFAULT_SESSION_LIMIT;
        return sessions
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, limit)
            .map(toSessionSummary);
    },

    /** 保存会话 */
    async saveSession(session: ChatSession): Promise<void> {
        const nextSession = normalizeSession({
            ...session,
            updatedAt: Date.now(),
        });
        Object.assign(session, nextSession);
        await FileHandler.writeJSON(
            sessionFile(nextSession.userId, nextSession.sessionId),
            nextSession,
        );
    },

    /** 更新会话元信息 */
    async updateSession(
        userId: string,
        sessionId: string,
        props: { title?: string; docUpdatedAt?: number },
    ): Promise<ChatSession | null> {
        const session = await this.getSession(userId, sessionId);
        if (!session) return null;
        if (props.title !== undefined) {
            session.title = props.title.trim() || DEFAULT_SESSION_TITLE;
        }
        if (props.docUpdatedAt !== undefined) {
            session.docUpdatedAt = props.docUpdatedAt;
        }
        await this.saveSession(session);
        return this.getSession(userId, sessionId);
    },

    generateMessageId() {
        return crypto.randomUUID();
    },

    newAssistantMessage(): ChatSessionAssistantMessage {
        return {
            messageId: this.generateMessageId(),
            role: 'assistant' as const,
            content: [],
            createdAt: Date.now(),
        };
    },

    newAssistantChatMessage(): ChatSessionAssistantChatMessage {
        return {
            messageId: this.generateMessageId(),
            role: 'assistant' as const,
            content: '',
            createdAt: Date.now(),
        };
    },

    newToolCallMessage(): ChatSessionToolCallMessage {
        return {
            toolCallId: this.generateMessageId(),
            runId: '',
            role: 'tool' as const,
            name: '',
            args: {},
            input: '',
            output: '',
            content: '',
            createdAt: Date.now(),
        };
    },

    /** 根据 runId 更新对应 tool call 的 content */
    async updateToolCallContent(
        userId: string,
        sessionId: string,
        runId: string,
        content: string,
    ): Promise<boolean> {
        const session = await this.getSession(userId, sessionId);
        if (!session) return false;
        for (const msg of session.messages) {
            if (msg.role !== 'assistant') continue;
            for (const item of msg.content) {
                if (item.role === 'tool' && item.runId === runId) {
                    item.content = content;
                    await this.saveSession(session);
                    return true;
                }
            }
        }
        return false;
    },

    /** 追加用户消息到会话 */
    async appendUserMessage(
        userId: string,
        sessionId: string,
        content: string,
    ): Promise<ChatSession | null> {
        const session = await this.getSession(userId, sessionId);
        if (!session) return null;
        const shouldGenerateTitle =
            !getFirstUserMessage(session) &&
            (!session.title || session.title === DEFAULT_SESSION_TITLE);
        session.messages.push({
            messageId: this.generateMessageId(),
            role: 'user',
            content,
            createdAt: Date.now(),
        });
        if (shouldGenerateTitle) {
            session.title = createSessionTitle(content);
        }
        await this.saveSession(session);
        return session;
    },

    /** 追加消息到会话 */
    async appendAssistantMessage(
        userId: string,
        sessionId: string,
        message: ChatSessionAssistantMessage,
    ): Promise<ChatSession | null> {
        const session = await this.getSession(userId, sessionId);
        if (!session) return null;
        session.messages.push({
            ...message,
        });
        await this.saveSession(session);
        return session;
    },

    /** 删除会话 */
    async deleteSession(userId: string, sessionId: string): Promise<boolean> {
        return FileHandler.deleteFile(sessionFile(userId, sessionId));
    },

    /** 清理过期会话（创建新会话时调用） */
    async cleanupSessions(userId: string): Promise<void> {
        const dir = userDir(userId);
        const files = await FileHandler.listFiles(dir);
        if (files.length === 0) return;

        // 读取所有会话并按更新时间排序
        const sessions: { file: string; updatedAt: number }[] = [];
        for (const file of files) {
            if (!file.endsWith('.json')) continue;
            const session = await FileHandler.readJSON<ChatSession>(
                path.join(dir, file),
            );
            if (session) {
                sessions.push({ file, updatedAt: session.updatedAt });
            }
        }
        sessions.sort((a, b) => b.updatedAt - a.updatedAt);

        const now = Date.now();
        for (let i = 0; i < sessions.length; i++) {
            const { file, updatedAt } = sessions[i];
            const shouldDelete =
                i >= MAX_SESSIONS || now - updatedAt > SESSION_TTL;
            if (shouldDelete) {
                await FileHandler.deleteFile(path.join(dir, file));
            }
        }
    },
};

export default ChatFile;

export function convertMessages(messages: ChatSessionChatMessage[]) {
    const result = [];
    for (const msg of messages) {
        switch (msg.role) {
            case 'user': {
                result.push(new HumanMessage(msg.content));
                break;
            }
            case 'assistant': {
                const pendingMessages: Array<AIMessage | ToolMessage> = [];
                for (const item of msg.content) {
                    switch (item.role) {
                        case 'assistant': {
                            pendingMessages.push(
                                new AIMessage({
                                    content: item.content,
                                    tool_calls: item.toolCalls,
                                }),
                            );
                            break;
                        }
                        case 'tool': {
                            pendingMessages.push(
                                new ToolMessage({
                                    tool_call_id: item.toolCallId,
                                    name: item.name,
                                    content: item.content,
                                }),
                            );
                            break;
                        }
                    }
                }
                result.push(...pendingMessages);
                break;
            }
        }
    }
    return result;
}
