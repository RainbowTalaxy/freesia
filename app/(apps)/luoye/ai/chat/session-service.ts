import API from '@/api';
import type { API as FetchRequest } from '@/api/fetch';
import serverFetch from '@/api/fetch/server';
import { ChatFile } from '@/files';
import type { ChatSession as BackendChatSession, ChatSessionMessage } from '@/api/types/luoye';
import type { ChatSession, ChatSessionChatMessage } from '@/files/luoye/chat';

export function normalizeToolInput(input: unknown): Record<string, unknown> {
    if (input && typeof input === 'object') return input as Record<string, unknown>;
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch {
            return { input };
        }
    }
    return {};
}

export function toBackendMessage(message: ChatSessionChatMessage): ChatSessionMessage {
    if (message.role === 'user') {
        return {
            schemaVersion: 1, messageId: message.messageId, type: 'user_message',
            content: message.content,
            ...(message.modelContent ? { modelContent: message.modelContent } : {}),
            ...(message.attachments?.length ? { attachments: message.attachments } : {}),
            createdAt: message.createdAt,
        };
    }
    return {
        schemaVersion: 1, messageId: message.messageId, type: 'assistant_message',
        parts: message.content.map((item) => item.role === 'assistant' ? {
            schemaVersion: 1, partId: item.messageId, type: 'text' as const,
            content: item.content, createdAt: item.createdAt,
            ...(item.reasoningContent !== undefined ? { reasoningContent: item.reasoningContent } : {}),
            ...(item.toolCalls !== undefined ? { toolCalls: item.toolCalls } : {}),
        } : {
            schemaVersion: 1, partId: item.toolCallId || ChatFile.generateMessageId(),
            type: 'tool_call' as const, toolName: item.name, runId: item.runId,
            ...(item.toolCallId ? { toolCallId: item.toolCallId } : {}),
            input: normalizeToolInput(item.input), output: item.output,
            content: item.content, createdAt: item.createdAt, updatedAt: item.createdAt,
        }),
        createdAt: message.createdAt,
    };
}

export function toLocalMessage(message: ChatSessionMessage): ChatSessionChatMessage {
    if (message.type === 'user_message') {
        return {
            messageId: message.messageId, role: 'user', content: message.content,
            ...(message.modelContent ? { modelContent: message.modelContent } : {}),
            ...(message.attachments?.length ? { attachments: message.attachments } : {}),
            createdAt: message.createdAt,
        };
    }
    return {
        messageId: message.messageId, role: 'assistant',
        content: message.parts.map((part) => part.type === 'text' ? {
            messageId: part.partId, role: 'assistant' as const,
            content: part.content, createdAt: part.createdAt,
            ...(part.reasoningContent !== undefined ? { reasoningContent: part.reasoningContent } : {}),
            ...(part.toolCalls !== undefined ? { toolCalls: part.toolCalls } : {}),
        } : {
            toolCallId: part.toolCallId || part.partId, runId: part.runId,
            role: 'tool' as const, name: part.toolName, args: {},
            input: part.input, output: part.output ?? '',
            content: part.status ?? part.content ?? '', createdAt: part.createdAt,
        }),
        createdAt: message.createdAt,
    };
}

export function mergeLocalModelContent(session: ChatSession, localSession: ChatSession | null) {
    if (!localSession) return session;
    const localUserMessages = new Map(localSession.messages
        .filter((message): message is Extract<ChatSessionChatMessage, { role: 'user' }> => message.role === 'user')
        .map((message) => [message.messageId, message.modelContent]));
    session.messages = session.messages.map((message) => {
        if (message.role === 'assistant') {
            const local = localSession.messages.find((item) => item.messageId === message.messageId);
            if (local?.role !== 'assistant') return message;
            return { ...message, content: message.content.map((part) => {
                if (part.role !== 'assistant') return part;
                const saved = local.content.find((item) => item.role === 'assistant' && item.messageId === part.messageId);
                if (saved?.role !== 'assistant') return part;
                return {
                    ...part,
                    reasoningContent: part.reasoningContent ?? saved.reasoningContent,
                    toolCalls: part.toolCalls ?? saved.toolCalls,
                };
            }) };
        }
        if (message.role !== 'user' || message.modelContent) return message;
        const modelContent = localUserMessages.get(message.messageId);
        return modelContent ? { ...message, modelContent } : message;
    });
    return session;
}

export function toLocalSession(session: BackendChatSession): ChatSession {
    return {
        schemaVersion: 1, sessionId: session.sessionId,
        ...(session.docId ? { docId: session.docId } : {}),
        userId: session.userId, title: session.title,
        messages: session.messages.map(toLocalMessage),
        ...(session.docUpdatedAt !== undefined ? { docUpdatedAt: session.docUpdatedAt } : {}),
        createdAt: session.createdAt, updatedAt: session.updatedAt,
    };
}

export async function requiredServerFetch<Data>(api: FetchRequest<Data>) {
    const result = await serverFetch(api, false, false);
    if (!result) throw new Error('请求失败');
    return result;
}

export async function appendBackendMessage(sessionId: string, message: ChatSessionChatMessage) {
    await requiredServerFetch(API.luoye.ai.chat.appendMessage(sessionId, {
        message: toBackendMessage(message),
    }));
}
