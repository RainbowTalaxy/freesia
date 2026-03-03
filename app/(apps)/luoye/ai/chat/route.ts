import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { ChatFile } from '@/files';
import { getMimoModel } from '../model';
import { streamControllers } from './state';

function sseEvent(data: Record<string, unknown>) {
    return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
    const user = await serverFetch(API.user.info(), true);
    if (!user) {
        return NextResponse.json({ message: '未登录' }, { status: 401 });
    }

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

    if (!docId || !message) {
        return NextResponse.json({ message: '缺少必填参数' }, { status: 400 });
    }

    // 获取文档内容作为上下文
    const doc = await serverFetch(API.luoye.doc(docId), true, false, {
        cache: 'no-store',
    });
    if (!doc) {
        return NextResponse.json({ message: '文档不存在' }, { status: 404 });
    }

    const userId = user.id;
    const isNewSession = !existingSessionId;
    const sessionId = existingSessionId || crypto.randomUUID();

    // 新会话：先清理再创建
    if (isNewSession) {
        await ChatFile.cleanupSessions(userId);
        await ChatFile.createSession(userId, sessionId, docId);
    }

    // 读取会话
    const session = await ChatFile.getSession(userId, sessionId);
    if (!session) {
        return NextResponse.json({ message: '会话不存在' }, { status: 404 });
    }

    // 保存用户消息
    const userMessageId = crypto.randomUUID();
    await ChatFile.appendMessage(userId, sessionId, {
        messageId: userMessageId,
        role: 'user',
        content: message,
        createdAt: Date.now(),
    });

    // 构建 LLM 消息列表
    const updatedSession = (await ChatFile.getSession(userId, sessionId))!;
    const systemPrompt = `你是一个文档助手，请基于以下文档内容回答用户问题。请使用中文回答。

文档标题：${doc.name || '无标题'}
文档内容：
${doc.content || '无内容'}`;

    const langchainMessages: { role: string; content: string }[] = [
        { role: 'system', content: systemPrompt },
    ];
    for (const msg of updatedSession.messages) {
        langchainMessages.push({ role: msg.role, content: msg.content });
    }

    // 创建 AbortController
    const abortController = new AbortController();
    streamControllers.set(sessionId, abortController);

    const assistantMessageId = crypto.randomUUID();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // 新会话时先发送 sessionId
                if (isNewSession) {
                    controller.enqueue(
                        encoder.encode(
                            sseEvent({ type: 'session', sessionId }),
                        ),
                    );
                }

                const model = getMimoModel();
                let fullContent = '';

                const streamResponse = await model.stream(langchainMessages, {
                    signal: abortController.signal,
                });

                for await (const chunk of streamResponse) {
                    const content =
                        typeof chunk.content === 'string' ? chunk.content : '';
                    if (content) {
                        fullContent += content;
                        controller.enqueue(
                            encoder.encode(
                                sseEvent({
                                    type: 'message',
                                    messageId: assistantMessageId,
                                    content,
                                }),
                            ),
                        );
                    }
                }

                // 流完成，保存 assistant 消息
                await ChatFile.appendMessage(userId, sessionId, {
                    messageId: assistantMessageId,
                    role: 'assistant',
                    content: fullContent,
                    createdAt: Date.now(),
                });

                controller.enqueue(
                    encoder.encode(
                        sseEvent({
                            type: 'done',
                            messageId: assistantMessageId,
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
