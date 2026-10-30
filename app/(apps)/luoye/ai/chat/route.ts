import { NextRequest, NextResponse } from 'next/server';
import { SystemMessage } from '@langchain/core/messages';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { ChatFile } from '@/files';
import { createChatAgent } from './agent';
import { streamControllers } from './state';
import {
    ChatSession as LocalChatSession,
    convertMessages,
} from '@/files/luoye/chat';
import { SseEventData } from './types';
import { appendBackendMessage, mergeLocalModelContent, requiredServerFetch, toLocalSession } from './session-service';
import { ChatStreamTranslator } from './stream-translator';
import {
    ChatImageAttachment,
    ChatSelection,
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

function normalizeSelection(input: unknown): ChatSelection | null {
    if (input === undefined || input === null) return null;
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const record = input as Partial<ChatSelection>;
    const { text, start, end } = record;
    if (
        typeof text !== 'string' ||
        !text.trim() ||
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start! < 0 ||
        end! < start!
    )
        return null;
    return { text, start: start!, end: end! };
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
        selection?: unknown;
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
        selection: rawSelection,
    } = body;
    const message = typeof rawMessage === 'string' ? rawMessage : '';
    const attachments = normalizeAttachments(rawAttachments, request.url);
    const selection = normalizeSelection(rawSelection);
    if (rawSelection !== undefined && !selection) {
        return NextResponse.json(
            { message: '选中内容参数无效' },
            { status: 400 },
        );
    }

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
    if (selection && !docId?.trim()) {
        return NextResponse.json(
            { message: '选中内容仅支持文档改稿' },
            { status: 400 },
        );
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
        const localSession = await ChatFile.getSession(
            userId,
            backendSession.sessionId,
        );
        session = mergeLocalModelContent(
            toLocalSession(backendSession),
            localSession,
        );
        await ChatFile.saveSession(session);
    }

    const sessionId = session.sessionId;

    // 保存用户消息
    let appendResult: LocalChatSession | null;
    try {
        appendResult = selection
            ? await ChatFile.appendUserMessage(
                  userId,
                  sessionId,
                  message,
                  attachments,
                  selection,
              )
            : await ChatFile.appendUserMessage(
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
        systemPrompt = `当前时间：${currentTime}。用户正在一个文档页面向你发起提问。文档 ID 为 "${doc.id}"。当前文档内容已在对话开头通过 read_doc 工具读取，请直接使用对话中已有的文档内容回答问题，无需重复调用 read_doc 读取同一文档，除非你被告知文档内容已更新。用户要求修改正文时，直接调用 edit_doc_request 返回完整的修改后正文，不要先在普通文本里输出完整草稿、也不要等待用户再次确认是否提交修改。续写、补充、润色、改写、纠错、整理等意图明确时均应主动发起修改请求，因为页面会由用户选择接受或放弃；只有在任务目标存在关键歧义时才最多询问一个问题。保持文档标题、权限、工作区和标签不变。`;
    } else {
        systemPrompt = `当前时间：${currentTime}。你是一个智能助手，可以回答用户的各种问题。你可以使用 search_docs 工具搜索用户的文档库，使用 read_doc 工具读取文档内容。需要修改文档时，先用 read_doc 获取目标文档 ID，再调用 edit_doc_request；工具会读取最新版本并生成待确认的修改请求。`;
    }

    // 检测文档变更（仅在有文档时）。更新标记在本轮成功完成后才提交，
    // 这样 agent 失败或用户中断时，下一轮仍能看到最新文档内容。
    const docChanged = Boolean(
        doc && session && session.docUpdatedAt !== doc.updatedAt,
    );

    const messages = [
        new SystemMessage(systemPrompt),
        ...convertMessages(session.messages),
    ];

    if (docChanged && doc) {
        messages.push(
            new SystemMessage(
                '当前文档内容自上次对话以来已被修改。以下是最新文档内容，后续回答和修改请求必须以此为准：\n\n' +
                    formatDocForReadDoc(doc),
            ),
        );
    }

    // 创建 AbortController，同时监听客户端断开事件
    const abortController = new AbortController();
    request.signal.addEventListener('abort', () => abortController.abort(), {
        once: true,
    });
    streamControllers.set(sessionId, abortController);

    const assistantMessage = ChatFile.newAssistantMessage();
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

                const agent = createChatAgent();
                const eventStream = agent.streamEvents(
                    { messages },
                    {
                        version: 'v2',
                        signal: abortController.signal,
                        recursionLimit: 100,
                    },
                );

                const translator = new ChatStreamTranslator(assistantMessage);
                for await (const event of eventStream) {
                    for (const data of translator.consume(event)) {
                        controller.enqueue(encoder.encode(sseEvent(data)));
                    }
                }

                abortController.signal.throwIfAborted();
                await ChatFile.appendAssistantMessage(
                    userId,
                    sessionId,
                    assistantMessage,
                );
                await appendBackendMessage(sessionId, assistantMessage);

                if (doc && docChanged) {
                    session.docUpdatedAt = doc.updatedAt;
                    try {
                        await ChatFile.saveSession(session);
                        await serverFetch(
                            API.luoye.ai.chat.updateSession(
                                session.sessionId,
                                { docUpdatedAt: doc.updatedAt },
                            ),
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

                controller.enqueue(
                    encoder.encode(
                        sseEvent({
                            type: 'done',
                            messageId: assistantMessage.messageId,
                        }),
                    ),
                );
            } catch (err: unknown) {
                abortController.abort();
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
