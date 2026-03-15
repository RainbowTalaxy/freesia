import { NextRequest, NextResponse } from 'next/server';
import { SystemMessage } from '@langchain/core/messages';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { ChatFile } from '@/files';
import { createChatAgent } from './agent';
import { streamControllers } from './state';
import {
    ChatSessionAssistantChatMessage,
    ChatSession,
    convertMessages,
} from '@/files/luoye/chat';
import { SseEventData, SseEventStreamEvent } from './types';
import { Doc } from '@/api/types/luoye';

function createFakeReadDocMessage(doc: Doc) {
    const toolCallId = `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const docContent = `文档标题：${doc.name || '无标题'}\n文档内容：\n${doc.content || '(空)'}`;
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

function sseEvent(data: SseEventData) {
    return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
    // 一、校验阶段

    // 验证用户
    const user = await serverFetch(API.user.info(), true);
    if (!user) {
        return NextResponse.json({ message: '未登录' }, { status: 401 });
    }

    // 获取接口参数
    const body = await request.json();
    const {
        docId,
        message,
        sessionId: existingSessionId,
    } = body as {
        docId: string;
        message: string;
        sessionId?: string;
    };

    // 参数检查
    if (!docId?.trim() || !message?.trim()) {
        return NextResponse.json({ message: '缺少必填参数' }, { status: 400 });
    }

    if (existingSessionId && streamControllers.has(existingSessionId)) {
        return NextResponse.json(
            { message: '当前会话正在处理中' },
            { status: 409 },
        );
    }

    // 获取文档内容
    const doc = await serverFetch(API.luoye.doc(docId), true, false, {
        cache: 'no-store',
    });
    if (!doc) {
        return NextResponse.json({ message: '文档不存在' }, { status: 404 });
    }

    // ## 二、会话管理阶段

    const userId = user.id;
    let session: ChatSession;

    if (!existingSessionId) {
        // 清理过期会话
        await ChatFile.cleanupSessions(userId);
        session = await ChatFile.createSession(userId, docId, doc.updatedAt);

        // 伪造一个 Assistant 消息，预先通过 read_doc 注入文档内容
        await ChatFile.appendAssistantMessage(
            userId,
            session.sessionId,
            createFakeReadDocMessage(doc),
        );
    } else {
        // 读取会话
        const oldSession = await ChatFile.getSession(userId, existingSessionId);

        if (!oldSession) {
            return NextResponse.json(
                { message: '会话不存在' },
                { status: 404 },
            );
        } else {
            session = oldSession;
        }
    }

    const sessionId = session.sessionId;

    // 保存用户消息
    await ChatFile.appendUserMessage(userId, sessionId, message);

    // 构建 LangChain 消息列表
    session = (await ChatFile.getSession(userId, sessionId))!;

    //提示词
    const systemPrompt = `用户正在一个文档页面向你发起提问。文档 ID 为 "${doc.id}"。当前文档内容已在对话开头通过 read_doc 工具读取，请直接使用对话中已有的文档内容回答问题，无需重复调用 read_doc 读取同一文档，除非你被告知文档内容已更新。`;

    // 检测文档变更
    let docChanged = false;

    if (session.docUpdatedAt !== doc.updatedAt) {
        docChanged = true;
        session.docUpdatedAt = doc.updatedAt;
        await ChatFile.saveSession(session);
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

    // 创建 AbortController
    const abortController = new AbortController();
    streamControllers.set(sessionId, abortController);

    let assistantMessage = ChatFile.newAssistantMessage();
    const encoder = new TextEncoder();

    // 创建 LangGraph ReAct Agent
    const agent = createChatAgent();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // 新会话时先发送 sessionId
                controller.enqueue(
                    encoder.encode(
                        sseEvent({
                            type: 'session',
                            sessionId,
                            messageId: assistantMessage.messageId,
                        }),
                    ),
                );

                const eventStream = agent.streamEvents(
                    { messages },
                    {
                        version: 'v2',
                        signal: abortController.signal,
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
                            if (!chunk || typeof chunk.content !== 'string') {
                                break;
                            }
                            if (!assistantChatMessage)
                                throw new Error('Missing assistantChatMessage');
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
                            if (!assistantChatMessage)
                                throw new Error('Missing assistantChatMessage');

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
                if (err instanceof Error && err.name === 'AbortError') {
                    // 中断 —— 不发送任何内容
                } else {
                    const errorMessage =
                        err instanceof Error ? err.message : '未知错误';

                    controller.enqueue(
                        encoder.encode(
                            sseEvent({ type: 'error', message: errorMessage }),
                        ),
                    );
                }
                console.error(err);
            } finally {
                streamControllers.delete(sessionId);
                controller.close();
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
