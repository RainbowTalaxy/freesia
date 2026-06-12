import { NextRequest, NextResponse } from 'next/server';
import { SystemMessage } from '@langchain/core/messages';
import API from '@/api';
import type { API as FetchRequest } from '@/api/fetch';
import serverFetch from '@/api/fetch/server';
import { ChatFile } from '@/files';
import { createChatAgent } from './agent';
import { streamControllers } from './state';
import {
    ChatSessionAssistantChatMessage,
    ChatSession as LocalChatSession,
    ChatSessionChatMessage,
    convertMessages,
} from '@/files/luoye/chat';
import { SseEventData, SseEventStreamEvent } from './types';
import {
    ChatImageAttachment,
    ChatSession as BackendChatSession,
    ChatSessionMessage,
    Doc,
} from '@/api/types/luoye';
import { formatCurrentTimeForPrompt, formatDocForReadDoc } from './format';

const TRUSTED_ATTACHMENT_PATH_PREFIX = '/statics/temp/luoye/';
const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;
const TRUSTED_ATTACHMENT_HOSTS = new Set([
    'blog.talaxy.cn',
    'localhost',
    '127.0.0.1',
]);
const SUPPORTED_ATTACHMENT_MIME_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
]);

/** 为文档页会话预置一次 read_doc 结果，避免 agent 首轮重复读取同一篇文档。 */
function createFakeReadDocMessage(doc: Doc) {
    const toolCallId = `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const docContent = formatDocForReadDoc(doc);
    const assistantMsg = ChatFile.newAssistantMessage();

    const chatMsg = ChatFile.newAssistantChatMessage();
    chatMsg.toolCalls = [
        { id: toolCallId, name: 'read_doc', args: { docId: doc.id } },
    ];

    const toolMsg = ChatFile.newToolCallMessage();
    toolMsg.toolCallId = toolCallId;
    toolMsg.name = 'read_doc';
    toolMsg.content = docContent;

    assistantMsg.content.push(chatMsg, toolMsg);
    return assistantMsg;
}

/** 将事件对象序列化为前端消费的 SSE data 块。 */
function sseEvent(data: SseEventData) {
    return `data: ${JSON.stringify(data)}\n\n`;
}

/** 后端 tool_call schema 要求 input 是对象；这里兼容旧本地记录里的字符串输入。 */
function normalizeToolInput(input: unknown): Record<string, unknown> {
    if (input && typeof input === 'object') {
        return input as Record<string, unknown>;
    }
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            if (parsed && typeof parsed === 'object') {
                return parsed as Record<string, unknown>;
            }
        } catch {
            return { input };
        }
    }
    return {};
}

function normalizeAttachments(
    input: unknown,
    _requestUrl: string,
): ChatImageAttachment[] {
    if (!Array.isArray(input)) return [];
    return input
        .filter((item): item is ChatImageAttachment => {
            if (!item || typeof item !== 'object') return false;
            const attachment = item as Partial<ChatImageAttachment>;
            if (
                typeof attachment.url !== 'string' ||
                typeof attachment.mimeType !== 'string'
            ) {
                return false;
            }
            let url: URL;
            try {
                url = new URL(attachment.url);
            } catch {
                return false;
            }
            return (
                typeof attachment.id === 'string' &&
                typeof attachment.name === 'string' &&
                SUPPORTED_ATTACHMENT_MIME_TYPES.has(attachment.mimeType) &&
                typeof attachment.size === 'number' &&
                attachment.size > 0 &&
                attachment.size <= MAX_ATTACHMENT_SIZE &&
                ['http:', 'https:'].includes(url.protocol) &&
                TRUSTED_ATTACHMENT_HOSTS.has(url.hostname) &&
                url.pathname.startsWith(TRUSTED_ATTACHMENT_PATH_PREFIX)
            );
        })
        .slice(0, 3);
}

function hasImageAttachments(messages: ChatSessionChatMessage[]) {
    return messages.some(
        (message) => message.role === 'user' && !!message.attachments?.length,
    );
}

/** 将本地备份消息结构转换为后端会话接口的 append-only 消息结构。 */
function toBackendMessage(message: ChatSessionChatMessage): ChatSessionMessage {
    if (message.role === 'user') {
        return {
            schemaVersion: 1,
            messageId: message.messageId,
            type: 'user_message',
            content: message.content,
            ...(message.attachments?.length
                ? { attachments: message.attachments }
                : {}),
            createdAt: message.createdAt,
        };
    }

    return {
        schemaVersion: 1,
        messageId: message.messageId,
        type: 'assistant_message',
        parts: message.content.map((item) => {
            if (item.role === 'assistant') {
                return {
                    schemaVersion: 1,
                    partId: item.messageId,
                    type: 'text' as const,
                    content: item.content,
                    createdAt: item.createdAt,
                };
            }
            return {
                schemaVersion: 1,
                partId: item.toolCallId || ChatFile.generateMessageId(),
                type: 'tool_call' as const,
                toolName: item.name,
                runId: item.runId,
                ...(item.toolCallId ? { toolCallId: item.toolCallId } : {}),
                input: normalizeToolInput(item.input),
                output: item.output,
                content: item.content,
                createdAt: item.createdAt,
                updatedAt: item.createdAt,
            };
        }),
        createdAt: message.createdAt,
    };
}

/** 将后端会话消息转换为现有 LangChain 上下文和本地备份可复用的结构。 */
function toLocalMessage(message: ChatSessionMessage): ChatSessionChatMessage {
    if (message.type === 'user_message') {
        return {
            messageId: message.messageId,
            role: 'user',
            content: message.content,
            ...(message.attachments?.length
                ? { attachments: message.attachments }
                : {}),
            createdAt: message.createdAt,
        };
    }

    return {
        messageId: message.messageId,
        role: 'assistant',
        content: message.parts.map((part) => {
            if (part.type === 'text') {
                return {
                    messageId: part.partId,
                    role: 'assistant' as const,
                    content: part.content,
                    createdAt: part.createdAt,
                };
            }
            return {
                toolCallId: part.toolCallId || part.partId,
                runId: part.runId,
                role: 'tool' as const,
                name: part.toolName,
                args: {},
                input: part.input as unknown as string,
                output: part.output as string,
                content: part.status ?? part.content ?? '',
                createdAt: part.createdAt,
            };
        }),
        createdAt: message.createdAt,
    };
}

/** 将后端会话详情落成本地备份格式，保留现有 convertMessages 链路。 */
function toLocalSession(session: BackendChatSession): LocalChatSession {
    return {
        schemaVersion: 1,
        sessionId: session.sessionId,
        ...(session.docId ? { docId: session.docId } : {}),
        userId: session.userId,
        title: session.title,
        messages: session.messages.map(toLocalMessage),
        ...(session.docUpdatedAt !== undefined
            ? { docUpdatedAt: session.docUpdatedAt }
            : {}),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
    };
}

/** 对后端主写接口使用无缓存请求，并把失败显式抛出给调用方处理。 */
async function requiredServerFetch<Data>(api: FetchRequest<Data>) {
    const result = await serverFetch(api, false, false);
    if (!result) {
        throw new Error('请求失败');
    }
    return result;
}

/** 将单条聊天消息追加到后端会话；失败时不能静默降级为仅本地保存。 */
async function appendBackendMessage(
    sessionId: string,
    message: ChatSessionChatMessage,
) {
    await requiredServerFetch(
        API.luoye.ai.chat.appendMessage(sessionId, {
            message: toBackendMessage(message),
        }),
    );
}

/** 处理聊天发送请求：恢复/创建会话、同步消息、并以 SSE 流式返回 agent 输出。 */
export async function POST(request: NextRequest) {
    // 一、校验阶段

    // 验证用户
    const user = await serverFetch(API.user.info(), true);
    if (!user) {
        return NextResponse.json({ message: '未登录' }, { status: 401 });
    }

    // 获取接口参数
    let body: {
        docId?: string;
        message: string;
        attachments?: ChatImageAttachment[];
        sessionId?: string;
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { message: '请求体格式错误' },
            { status: 400 },
        );
    }
    const {
        docId,
        message: rawMessage,
        attachments: rawAttachments,
        sessionId: existingSessionId,
    } = body;
    const message = typeof rawMessage === 'string' ? rawMessage : '';
    const attachments = normalizeAttachments(rawAttachments, request.url);

    // 参数检查
    if (
        Array.isArray(rawAttachments) &&
        rawAttachments.length !== attachments.length
    ) {
        return NextResponse.json({ message: '图片附件无效' }, { status: 400 });
    }

    if (!message?.trim() && attachments.length === 0) {
        return NextResponse.json({ message: '缺少必填参数' }, { status: 400 });
    }

    if (existingSessionId && streamControllers.has(existingSessionId)) {
        return NextResponse.json(
            { message: '当前会话正在处理中' },
            { status: 409 },
        );
    }

    // 获取文档内容（仅在传入 docId 时）
    let doc: Doc | null = null;
    if (docId?.trim()) {
        doc = await serverFetch(API.luoye.doc(docId), true, false, {
            cache: 'no-store',
        });
        if (!doc) {
            return NextResponse.json(
                { message: '文档不存在' },
                { status: 404 },
            );
        }
    }

    // ## 二、会话管理阶段

    const userId = user.id;
    let session: LocalChatSession;
    const isNewSession = !existingSessionId;

    if (isNewSession) {
        // 清理过期会话（失败不阻断主流程）
        try {
            await ChatFile.cleanupSessions(userId);
        } catch (cleanupErr) {
            console.error('[chat] Failed to cleanup sessions:', cleanupErr);
        }

        try {
            const backendSession = await requiredServerFetch(
                API.luoye.ai.chat.createSession({
                    ...(doc?.id ? { docId: doc.id } : {}),
                    ...(doc?.updatedAt !== undefined
                        ? { docUpdatedAt: doc.updatedAt }
                        : {}),
                }),
            );
            session = toLocalSession(backendSession);
            await ChatFile.saveSession(session);

            // 有文档时，伪造一个 Assistant 消息，预先通过 read_doc 注入文档内容
            if (doc) {
                const readDocMessage = createFakeReadDocMessage(doc);
                await ChatFile.appendAssistantMessage(
                    userId,
                    session.sessionId,
                    readDocMessage,
                );
                await appendBackendMessage(session.sessionId, readDocMessage);
            }
        } catch {
            return NextResponse.json(
                { message: '创建会话失败' },
                { status: 500 },
            );
        }
    } else {
        const backendSession = await serverFetch(
            API.luoye.ai.chat.getSession(existingSessionId),
            true,
            false,
        );
        if (!backendSession) {
            return NextResponse.json(
                { message: '会话不存在' },
                { status: 404 },
            );
        }
        session = toLocalSession(backendSession);
        await ChatFile.saveSession(session);
    }

    const sessionId = session.sessionId;

    // 保存用户消息
    let appendResult: LocalChatSession | null;
    try {
        appendResult = await ChatFile.appendUserMessage(
            userId,
            sessionId,
            message,
            attachments,
        );
    } catch {
        return NextResponse.json(
            { message: '保存用户消息失败' },
            { status: 500 },
        );
    }
    if (!appendResult) {
        return NextResponse.json(
            { message: '保存用户消息失败' },
            { status: 500 },
        );
    }

    // appendUserMessage 返回值即为包含最新消息的会话，无需再次读取文件
    session = appendResult;
    try {
        await appendBackendMessage(
            sessionId,
            session.messages[session.messages.length - 1],
        );
    } catch (error) {
        console.error(
            '[chat] Failed to append user message to backend:',
            error,
        );
        return NextResponse.json(
            { message: '保存用户消息失败' },
            { status: 500 },
        );
    }

    //提示词
    const currentTime = formatCurrentTimeForPrompt();
    let systemPrompt: string;
    if (doc) {
        systemPrompt = `当前时间：${currentTime}。用户正在一个文档页面向你发起提问。文档 ID 为 "${doc.id}"。当前文档内容已在对话开头通过 read_doc 工具读取，请直接使用对话中已有的文档内容回答问题，无需重复调用 read_doc 读取同一文档，除非你被告知文档内容已更新。`;
    } else {
        systemPrompt = `当前时间：${currentTime}。你是一个智能助手，可以回答用户的各种问题。你可以使用 search_docs 工具搜索用户的文档库，使用 read_doc 工具读取文档内容。`;
    }

    // 检测文档变更（仅在有文档时）
    let docChanged = false;

    if (
        doc &&
        session?.docUpdatedAt !== undefined &&
        session.docUpdatedAt !== doc.updatedAt
    ) {
        docChanged = true;
        session.docUpdatedAt = doc.updatedAt;
        try {
            await ChatFile.saveSession(session);
            await serverFetch(
                API.luoye.ai.chat.updateSession(session.sessionId, {
                    docUpdatedAt: doc.updatedAt,
                }),
                true,
                false,
            );
        } catch (saveErr) {
            console.error(
                '[chat] Failed to save session on doc change:',
                saveErr,
            );
        }
    }

    const messages = [
        new SystemMessage(systemPrompt),
        ...convertMessages(session.messages),
    ];

    if (docChanged) {
        messages.push(
            new SystemMessage('当前文档内容自上次对话以来已被修改。'),
        );
    }

    // 创建 AbortController，同时监听客户端断开事件
    const abortController = new AbortController();
    request.signal.addEventListener('abort', () => abortController.abort(), {
        once: true,
    });
    streamControllers.set(sessionId, abortController);

    let assistantMessage = ChatFile.newAssistantMessage();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        cancel() {
            // 客户端断开连接时触发，主动中止 agent 推理
            abortController.abort();
        },
        async start(controller) {
            try {
                // 新会话时先发送 sessionId
                if (isNewSession) {
                    controller.enqueue(
                        encoder.encode(
                            sseEvent({
                                type: 'session',
                                sessionId,
                                messageId: assistantMessage.messageId,
                            }),
                        ),
                    );
                }

                const agent = createChatAgent({
                    multimodal: hasImageAttachments(session.messages),
                });
                const eventStream = agent.streamEvents(
                    { messages },
                    {
                        version: 'v2',
                        signal: abortController.signal,
                        recursionLimit: 100,
                    },
                );

                let assistantChatMessage: ChatSessionAssistantChatMessage | null =
                    null;

                for await (const event of eventStream) {
                    switch (event.event) {
                        case SseEventStreamEvent.OnChatModelStart: {
                            assistantChatMessage =
                                ChatFile.newAssistantChatMessage();
                            break;
                        }

                        // 当正在返回 AI 回复时，持续发送消息块给前端展示
                        case SseEventStreamEvent.OnChatModelStream: {
                            const chunk = event.data.chunk;
                            if (!chunk) break;
                            if (typeof chunk.content !== 'string') {
                                console.warn(
                                    '[chat] OnChatModelStream: unexpected non-string chunk content, type:',
                                    typeof chunk.content,
                                );
                                break;
                            }
                            if (!assistantChatMessage) {
                                console.error(
                                    '[chat] OnChatModelStream: missing assistantChatMessage, skipping chunk',
                                );
                                break;
                            }
                            assistantChatMessage.content += chunk.content;
                            controller.enqueue(
                                encoder.encode(
                                    sseEvent({
                                        type: 'message',
                                        messageId:
                                            assistantChatMessage.messageId,
                                        content: chunk.content,
                                    }),
                                ),
                            );
                            break;
                        }

                        case SseEventStreamEvent.OnChatModelEnd: {
                            if (!assistantChatMessage) {
                                console.error(
                                    '[chat] OnChatModelEnd: missing assistantChatMessage, skipping',
                                );
                                assistantChatMessage = null;
                                break;
                            }

                            assistantMessage.content.push(assistantChatMessage);

                            const output = event.data.output;
                            if (output?.tool_calls?.length > 0) {
                                const toolCalls = output.tool_calls.map(
                                    (tc: {
                                        id?: string;
                                        name: string;
                                        args: Record<string, unknown>;
                                    }) => ({
                                        id: tc.id,
                                        name: tc.name,
                                        args: tc.args,
                                    }),
                                );

                                assistantChatMessage.toolCalls = toolCalls;
                            }
                            break;
                        }

                        case SseEventStreamEvent.OnToolStart: {
                            controller.enqueue(
                                encoder.encode(
                                    sseEvent({
                                        type: 'tool_start',
                                        name: event.name,
                                        run_id: event.run_id,
                                        input: event.data.input,
                                    }),
                                ),
                            );
                            break;
                        }

                        case SseEventStreamEvent.OnToolEnd: {
                            const output = event.data.output;

                            const toolCallMessage =
                                ChatFile.newToolCallMessage();
                            toolCallMessage.name = event.name;
                            toolCallMessage.runId = event.run_id;
                            toolCallMessage.input = event.data.input;
                            toolCallMessage.output = output;
                            toolCallMessage.content = output?.content;
                            toolCallMessage.toolCallId = output?.tool_call_id;

                            assistantMessage.content.push(toolCallMessage);

                            controller.enqueue(
                                encoder.encode(
                                    sseEvent({
                                        type: 'tool_end',
                                        run_id: event.run_id,
                                        name: event.name,
                                        input: event.data.input,
                                        content: output?.content,
                                    }),
                                ),
                            );
                            break;
                        }
                    }
                }

                await ChatFile.appendAssistantMessage(
                    userId,
                    sessionId,
                    assistantMessage,
                );
                await appendBackendMessage(sessionId, assistantMessage);

                controller.enqueue(
                    encoder.encode(
                        sseEvent({
                            type: 'done',
                            messageId: assistantMessage.messageId,
                        }),
                    ),
                );
            } catch (err: unknown) {
                // 被中断时不写入错误事件（中断接口会处理状态恢复）
                // Node.js 18+ 中 DOMException extends Error，instanceof Error 已覆盖两者
                if (err instanceof Error && err.name === 'AbortError') {
                    // 中断 —— 不发送任何内容
                } else {
                    const errorMessage =
                        err instanceof Error ? err.message : '未知错误';

                    try {
                        controller.enqueue(
                            encoder.encode(
                                sseEvent({
                                    type: 'error',
                                    message: errorMessage,
                                }),
                            ),
                        );
                    } catch {
                        // stream 已关闭，忽略
                    }
                }
                console.error(err);
            } finally {
                streamControllers.delete(sessionId);
                try {
                    controller.close();
                } catch {
                    // stream 已关闭，忽略
                }
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
