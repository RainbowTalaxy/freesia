import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { streamControllers } from '../../app/(apps)/luoye/ai/chat/state';

// ---- Mocks ----

const mockServerFetch = vi.fn();
vi.mock('@/api/fetch/server', () => ({
    default: (...args: unknown[]) => mockServerFetch(...args),
}));

vi.mock('@/api', () => {
    const Rocket = {
        get: (url: string) => ({ url, method: 'GET' }),
        post: (url: string, data?: unknown) => ({ url, method: 'POST', data }),
        patch: (url: string, data?: unknown) => ({
            url,
            method: 'PATCH',
            data,
        }),
        delete: (url: string) => ({ url, method: 'DELETE' }),
    };
    return {
        default: {
            user: { info: () => Rocket.get('/api/user') },
            luoye: {
                doc: (id: string) => Rocket.get(`/api/luoye/doc/${id}`),
                ai: {
                    chat: {
                        createSession: (props?: unknown) =>
                            Rocket.post('/api/luoye/chat-sessions', props),
                        getSession: (sessionId: string) =>
                            Rocket.get(
                                `/api/luoye/chat-sessions/${sessionId}`,
                            ),
                        updateSession: (sessionId: string, props: unknown) =>
                            Rocket.patch(
                                `/api/luoye/chat-sessions/${sessionId}`,
                                props,
                            ),
                        appendMessage: (sessionId: string, props: unknown) =>
                            Rocket.post(
                                `/api/luoye/chat-sessions/${sessionId}/messages`,
                                props,
                            ),
                        updateToolCall: (
                            sessionId: string,
                            runId: string,
                            props: unknown,
                        ) =>
                            Rocket.patch(
                                `/api/luoye/chat-sessions/${sessionId}/tool-calls/${runId}`,
                                props,
                            ),
                    },
                },
            },
        },
    };
});

const mockChatFile = {
    cleanupSessions: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    appendUserMessage: vi.fn(),
    appendAssistantMessage: vi.fn(),
    saveSession: vi.fn(),
    deleteSession: vi.fn(),
    newAssistantMessage: vi.fn(() => ({
        messageId: 'assistant-msg-1',
        role: 'assistant',
        content: [],
        createdAt: Date.now(),
    })),
    newAssistantChatMessage: vi.fn(() => ({
        messageId: 'chat-msg-1',
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
    })),
    newToolCallMessage: vi.fn(() => ({
        toolCallId: 'tool-call-1',
        role: 'tool',
        name: '',
        args: {},
        input: '',
        output: '',
        content: '',
        createdAt: Date.now(),
    })),
};
vi.mock('@/files', () => ({
    ChatFile: mockChatFile,
}));

// 模拟 Agent 的 streamEvents 方法
const mockStreamEvents = vi.fn();
const mockCreateChatAgent = vi.fn(() => ({
    streamEvents: mockStreamEvents,
}));
vi.mock('../../app/(apps)/luoye/ai/chat/agent', () => ({
    createChatAgent: () => mockCreateChatAgent(),
}));

// ---- Helpers ----

function makeRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost:3000/luoye/ai/chat', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });
}

async function readSSEStream(response: Response): Promise<string[]> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const events: string[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        // 按 "data: " 前缀拆分事件
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        events.push(...lines.map((l) => l.slice(6)));
    }
    return events;
}

function makeSession(
    overrides: Partial<import('@/files/luoye/chat').ChatSession> = {},
) {
    return {
        schemaVersion: 1 as const,
        sessionId: 'session-1',
        docId: 'doc-1',
        userId: 'user-1',
        title: '新会话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    };
}

function withUserMessage(
    session: ReturnType<typeof makeSession>,
    content: string,
) {
    return {
        ...session,
        messages: [
            ...session.messages,
            {
                messageId: 'msg-1',
                role: 'user' as const,
                content,
                createdAt: Date.now(),
            },
        ],
    };
}

function backendMessageFromLocal(
    message: import('@/files/luoye/chat').ChatSession['messages'][number],
) {
    if (message.role === 'user') {
        return {
            schemaVersion: 1,
            messageId: message.messageId,
            type: 'user_message',
            content: message.content,
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
                    type: 'text',
                    content: item.content,
                    createdAt: item.createdAt,
                };
            }
            return {
                schemaVersion: 1,
                partId: item.toolCallId,
                type: 'tool_call',
                toolName: item.name,
                runId: item.runId,
                toolCallId: item.toolCallId,
                input: {},
                output: item.output,
                content: item.content,
                createdAt: item.createdAt,
                updatedAt: item.createdAt,
            };
        }),
        createdAt: message.createdAt,
    };
}

function makeBackendSession(
    overrides: Partial<import('@/api/types/luoye').ChatSession> = {},
) {
    const localSession = makeSession();
    return {
        schemaVersion: 1 as const,
        sessionId: localSession.sessionId,
        docId: localSession.docId,
        userId: localSession.userId,
        title: localSession.title,
        messages: localSession.messages.map(backendMessageFromLocal),
        createdAt: localSession.createdAt,
        updatedAt: localSession.updatedAt,
        ...overrides,
    };
}

function defaultServerFetch(
    request: { url?: string; method?: string; data?: unknown },
) {
    const url = request.url ?? '';
    if (url === '/api/user') return Promise.resolve({ id: 'user-1' });
    if (url.includes('/api/luoye/doc/')) {
        return Promise.resolve({
            id: url.split('/').pop() || 'doc-1',
            name: '文档',
            content: '内容',
            updatedAt: 1,
        });
    }
    if (url === '/api/luoye/chat-sessions') {
        return Promise.resolve(
            makeBackendSession(
                (request.data ?? {}) as Partial<
                    import('@/api/types/luoye').ChatSession
                >,
            ),
        );
    }
    if (url.includes('/api/luoye/chat-sessions/')) {
        const [, sessionId = 'session-1'] =
            url.match(/chat-sessions\/([^/]+)/) ?? [];
        return Promise.resolve(makeBackendSession({ sessionId }));
    }
    return Promise.resolve({});
}

// 创建模拟的 agent streamEvents（模拟 ReAct Agent 事件流）
async function* fakeAgentEvents(contents: string[]) {
    yield { event: 'on_chat_model_start', data: {} };
    for (const content of contents) {
        yield {
            event: 'on_chat_model_stream',
            data: { chunk: { content } },
        };
    }
    yield {
        event: 'on_chat_model_end',
        data: { output: { tool_calls: [] } },
    };
}

// ---- Tests ----

describe('POST /luoye/ai/chat (发送消息)', () => {
    let POST: typeof import('../../app/(apps)/luoye/ai/chat/route').POST;

    beforeEach(async () => {
        vi.resetAllMocks();
        mockServerFetch.mockImplementation(defaultServerFetch);
        streamControllers.clear();
        mockCreateChatAgent.mockImplementation(() => ({
            streamEvents: mockStreamEvents,
        }));
        mockChatFile.newAssistantMessage.mockImplementation(() => ({
            messageId: 'assistant-msg-1',
            role: 'assistant',
            content: [],
            createdAt: Date.now(),
        }));
        mockChatFile.newAssistantChatMessage.mockImplementation(() => ({
            messageId: 'chat-msg-1',
            role: 'assistant',
            content: '',
            createdAt: Date.now(),
        }));
        mockChatFile.newToolCallMessage.mockImplementation(() => ({
            toolCallId: 'tool-call-1',
            role: 'tool',
            name: '',
            args: {},
            input: '',
            output: '',
            content: '',
            createdAt: Date.now(),
        }));
        // 动态导入以确保 mock 生效
        const mod = await import('../../app/(apps)/luoye/ai/chat/route');
        POST = mod.POST;
    });

    it('未登录应返回 401', async () => {
        mockServerFetch.mockResolvedValueOnce(null); // user.info → null

        const res = await POST(
            makeRequest({ docId: 'doc-1', message: '你好' }),
        );
        expect(res.status).toBe(401);

        const body = await res.json();
        expect(body.message).toBe('未登录');
    });

    it('缺少 message 应返回 400', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });

        const res = await POST(makeRequest({ docId: 'doc-1' }));
        expect(res.status).toBe(400);
    });

    it('不传 docId 且不传 message 应返回 400', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });

        const res = await POST(makeRequest({}));
        expect(res.status).toBe(400);
    });

    it('文档不存在应返回 404', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' }) // user.info
            .mockResolvedValueOnce(null); // doc → null

        const res = await POST(
            makeRequest({ docId: 'doc-1', message: '你好' }),
        );
        expect(res.status).toBe(404);

        const body = await res.json();
        expect(body.message).toBe('文档不存在');
    });

    it('新会话应返回 SSE 流，包含 session 事件', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                id: 'doc-1',
                name: '测试文档',
                content: '内容',
            });

        const session = makeSession();
        mockChatFile.cleanupSessions.mockResolvedValue(undefined);
        mockChatFile.createSession.mockResolvedValue(session);
        mockChatFile.getSession
            .mockResolvedValueOnce(session) // 读取会话
            .mockResolvedValueOnce({
                ...session,
                messages: [
                    {
                        messageId: 'msg-1',
                        role: 'user',
                        content: '你好',
                        createdAt: Date.now(),
                    },
                ],
            }); // 构建消息列表
        mockChatFile.appendUserMessage.mockResolvedValue(
            withUserMessage(session, '你好'),
        );
        mockStreamEvents.mockReturnValue(fakeAgentEvents(['你', '好', '呀']));

        const res = await POST(
            makeRequest({ docId: 'doc-1', message: '你好' }),
        );
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('text/event-stream');

        const events = await readSSEStream(res);
        expect(events.length).toBeGreaterThanOrEqual(3);

        // 第一个事件应该是 session
        const firstEvent = JSON.parse(events[0]);
        expect(firstEvent.type).toBe('session');
        expect(firstEvent.sessionId).toBeTypeOf('string');

        // 最后一个事件应该是 done
        const lastEvent = JSON.parse(events[events.length - 1]);
        expect(lastEvent.type).toBe('done');
    });

    it('已有会话应不返回 session 事件', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                id: 'doc-1',
                name: '文档',
                content: '内容',
            });

        const session = makeSession({ sessionId: 'existing-session' });
        mockChatFile.getSession
            .mockResolvedValueOnce(session)
            .mockResolvedValueOnce({
                ...session,
                messages: [
                    {
                        messageId: 'msg-1',
                        role: 'user',
                        content: '继续',
                        createdAt: Date.now(),
                    },
                ],
            });
        mockChatFile.appendUserMessage.mockResolvedValue(
            withUserMessage(session, '继续'),
        );
        mockStreamEvents.mockReturnValue(fakeAgentEvents(['好的']));

        const res = await POST(
            makeRequest({
                docId: 'doc-1',
                message: '继续',
                sessionId: 'existing-session',
            }),
        );
        expect(res.status).toBe(200);

        const events = await readSSEStream(res);
        const types = events.map((e) => JSON.parse(e).type);
        expect(types).not.toContain('session');
        expect(types).toContain('message');
        expect(types).toContain('done');
    });

    it('已有 sessionId 但会话不存在应返回 404', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                id: 'doc-1',
                name: '文档',
                content: '内容',
            })
            .mockResolvedValueOnce(null);

        const res = await POST(
            makeRequest({
                docId: 'doc-1',
                message: '你好',
                sessionId: 'gone-session',
            }),
        );
        expect(res.status).toBe(404);
    });

    it('LLM 异常应发送 error 事件', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                id: 'doc-1',
                name: '文档',
                content: '内容',
            });

        const session = makeSession();
        mockChatFile.cleanupSessions.mockResolvedValue(undefined);
        mockChatFile.createSession.mockResolvedValue(session);
        mockChatFile.getSession
            .mockResolvedValueOnce(session)
            .mockResolvedValueOnce({
                ...session,
                messages: [
                    {
                        messageId: 'msg-1',
                        role: 'user',
                        content: '你好',
                        createdAt: Date.now(),
                    },
                ],
            });
        mockChatFile.appendUserMessage.mockResolvedValue(
            withUserMessage(session, '你好'),
        );

        // LLM 抛出异常
        mockStreamEvents.mockReturnValue(
            (async function* () {
                throw new Error('模型调用失败');
            })(),
        );

        const res = await POST(
            makeRequest({ docId: 'doc-1', message: '你好' }),
        );
        const events = await readSSEStream(res);

        const errorEvents = events
            .map((e) => JSON.parse(e))
            .filter((e) => e.type === 'error');
        expect(errorEvents.length).toBe(1);
        expect(errorEvents[0].message).toBe('模型调用失败');
    });

    it('agent 初始化失败时，新会话仍应先发送 session 事件', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });

        const session = makeSession({ docId: undefined });
        mockChatFile.cleanupSessions.mockResolvedValue(undefined);
        mockChatFile.createSession.mockResolvedValue(session);
        mockChatFile.appendUserMessage.mockResolvedValue(
            withUserMessage(session, '你好'),
        );
        mockCreateChatAgent.mockImplementationOnce(() => {
            throw new Error('agent 初始化失败');
        });

        const res = await POST(makeRequest({ message: '你好' }));
        expect(res.status).toBe(200);

        const events = await readSSEStream(res);
        const parsed = events.map((e) => JSON.parse(e));

        expect(parsed[0]).toMatchObject({
            type: 'session',
            sessionId: session.sessionId,
        });
        expect(parsed[1]).toMatchObject({
            type: 'error',
            message: 'agent 初始化失败',
        });
    });

    it('后端保存用户消息失败应返回 500 且不启动 agent', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce(makeBackendSession({ docId: undefined }))
            .mockRejectedValueOnce(new Error('append failed'));

        const session = makeSession({ docId: undefined });
        mockChatFile.cleanupSessions.mockResolvedValue(undefined);
        mockChatFile.appendUserMessage.mockResolvedValue(
            withUserMessage(session, '你好'),
        );

        const res = await POST(makeRequest({ message: '你好' }));
        expect(res.status).toBe(500);
        expect(await res.json()).toMatchObject({
            message: '保存用户消息失败',
        });
        expect(mockCreateChatAgent).not.toHaveBeenCalled();
    });

    it('保存 assistant 消息失败时应发送 error 事件而不是 done', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });

        const session = makeSession({ docId: undefined });
        mockChatFile.cleanupSessions.mockResolvedValue(undefined);
        mockChatFile.createSession.mockResolvedValue(session);
        mockChatFile.appendUserMessage.mockResolvedValue(
            withUserMessage(session, '你好'),
        );
        mockChatFile.appendAssistantMessage.mockRejectedValueOnce(
            new Error('保存回复失败'),
        );
        mockStreamEvents.mockReturnValue(fakeAgentEvents(['你', '好']));

        const res = await POST(makeRequest({ message: '你好' }));
        expect(res.status).toBe(200);

        const events = await readSSEStream(res);
        const parsed = events.map((e) => JSON.parse(e));
        const types = parsed.map((event) => event.type);

        expect(types).toContain('error');
        expect(types).not.toContain('done');
        expect(parsed.find((event) => event.type === 'error')).toMatchObject({
            message: '保存回复失败',
        });
    });

    it('应使用 cache: "no-store" 选项获取文档内容以确保内容最新', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' }) // user info
            .mockResolvedValueOnce({
                id: 'doc-1',
                name: '文档',
                content: '内容',
            }); // doc info

        const session = makeSession();
        mockChatFile.cleanupSessions.mockResolvedValue(undefined);
        mockChatFile.createSession.mockResolvedValue(session);
        mockChatFile.getSession.mockResolvedValue(session);
        mockChatFile.appendUserMessage.mockResolvedValue(
            withUserMessage(session, 'Hello'),
        );
        mockStreamEvents.mockReturnValue(fakeAgentEvents(['Hello']));

        await POST(makeRequest({ docId: 'doc-1', message: 'Hello' }));

        // 验证第二次调用 (获取文档) 的参数
        expect(mockServerFetch).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                url: expect.stringContaining('/doc/doc-1'),
            }),
            true,
            false,
            { cache: 'no-store' },
        );
    });

    it('不传 docId 时应正常创建会话并返回流', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' }); // user info only

        const session = makeSession({ docId: undefined });
        mockChatFile.cleanupSessions.mockResolvedValue(undefined);
        mockChatFile.createSession.mockResolvedValue(session);
        mockChatFile.getSession
            .mockResolvedValueOnce(session)
            .mockResolvedValueOnce({
                ...session,
                messages: [
                    {
                        messageId: 'msg-1',
                        role: 'user',
                        content: '你好',
                        createdAt: Date.now(),
                    },
                ],
            });
        mockChatFile.appendUserMessage.mockResolvedValue(
            withUserMessage(session, '你好'),
        );
        mockStreamEvents.mockReturnValue(fakeAgentEvents(['你', '好']));

        const res = await POST(makeRequest({ message: '你好' }));
        expect(res.status).toBe(200);

        const events = await readSSEStream(res);
        const types = events.map((e) => JSON.parse(e).type);
        expect(types).toContain('session');
        expect(types).toContain('done');

        expect(mockServerFetch).not.toHaveBeenCalledWith(
            expect.objectContaining({
                url: expect.stringContaining('/doc/'),
            }),
            expect.anything(),
            expect.anything(),
            expect.anything(),
        );
        expect(mockServerFetch).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/api/luoye/chat-sessions',
                method: 'POST',
            }),
            false,
            false,
        );
    });
});
