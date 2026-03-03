import path from 'path';
import FileHandler from '../FileHandler';

/** 聊天会话数据存储根目录 */
const CHAT_DIR = path.join(process.cwd(), 'temp/luoye/chat');

/** 会话最大数量 */
const MAX_SESSIONS = 10;

/** 会话过期时间（7 天） */
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

export interface ChatMessage {
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
}

export interface ChatSession {
    sessionId: string;
    docId: string;
    userId: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}

function userDir(userId: string) {
    return path.join(CHAT_DIR, userId);
}

function sessionFile(userId: string, sessionId: string) {
    return path.join(userDir(userId), `${sessionId}.json`);
}

const ChatFile = {
    /** 创建新会话 */
    async createSession(
        userId: string,
        sessionId: string,
        docId: string,
    ): Promise<ChatSession> {
        const now = Date.now();
        const session: ChatSession = {
            sessionId,
            docId,
            userId,
            messages: [],
            createdAt: now,
            updatedAt: now,
        };
        await FileHandler.writeJSON(sessionFile(userId, sessionId), session);
        return session;
    },

    /** 读取会话 */
    async getSession(
        userId: string,
        sessionId: string,
    ): Promise<ChatSession | null> {
        return FileHandler.readJSON<ChatSession>(
            sessionFile(userId, sessionId),
        );
    },

    /** 保存会话 */
    async saveSession(session: ChatSession): Promise<void> {
        session.updatedAt = Date.now();
        await FileHandler.writeJSON(
            sessionFile(session.userId, session.sessionId),
            session,
        );
    },

    /** 追加消息到会话 */
    async appendMessage(
        userId: string,
        sessionId: string,
        message: ChatMessage,
    ): Promise<ChatSession | null> {
        const session = await this.getSession(userId, sessionId);
        if (!session) return null;
        session.messages.push(message);
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
