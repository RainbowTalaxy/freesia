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
    };
    return {
        default: {
            user: { info: () => Rocket.get('/api/user') },
        },
    };
});

const mockChatFile = {
    getSession: vi.fn(),
    saveSession: vi.fn(),
};
vi.mock('@/files', () => ({
    ChatFile: mockChatFile,
}));

// ---- Helpers ----

function makeParams(sessionId: string) {
    return { params: { sessionId } };
}

const dummyRequest = new NextRequest('http://localhost:3000', {
    method: 'POST',
});

// ---- Tests ----

describe('POST /luoye/ai/chat/:sessionId/abort (中断流式响应)', () => {
    let POST: typeof import('../../app/(apps)/luoye/ai/chat/[sessionId]/abort/route').POST;

    beforeEach(async () => {
        vi.clearAllMocks();
        streamControllers.clear();
        const mod =
            await import('../../app/(apps)/luoye/ai/chat/[sessionId]/abort/route');
        POST = mod.POST;
    });

    it('未登录应返回 401', async () => {
        mockServerFetch.mockResolvedValueOnce(null);

        const res = await POST(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(401);
    });

    it('会话不存在应返回 404', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce(null);

        const res = await POST(dummyRequest, makeParams('nonexistent'));
        expect(res.status).toBe(404);
    });

    it('非会话拥有者应返回 403', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce({
            sessionId: 'session-1',
            userId: 'other-user',
            messages: [],
        });

        const res = await POST(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(403);
    });

    it('没有进行中的流式响应应返回 404', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce({
            sessionId: 'session-1',
            userId: 'user-1',
            messages: [],
        });
        // streamControllers 中没有该 sessionId

        const res = await POST(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(404);

        const body = await res.json();
        expect(body.message).toBe('没有进行中的响应');
    });

    it('正常中断应调用 abort 并返回 success', async () => {
        const abortController = new AbortController();
        const abortSpy = vi.spyOn(abortController, 'abort');
        streamControllers.set('session-1', abortController);

        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce({
            sessionId: 'session-1',
            userId: 'user-1',
            messages: [
                {
                    messageId: 'msg-1',
                    role: 'user',
                    content: '你好',
                    createdAt: Date.now(),
                },
            ],
        });

        const res = await POST(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.success).toBe(true);
        expect(abortSpy).toHaveBeenCalled();
        expect(streamControllers.has('session-1')).toBe(false);
    });

    it('中断时最后一条是 assistant 消息应删除并恢复', async () => {
        const abortController = new AbortController();
        streamControllers.set('session-2', abortController);

        const session = {
            sessionId: 'session-2',
            userId: 'user-1',
            messages: [
                {
                    messageId: 'msg-1',
                    role: 'user',
                    content: '你好',
                    createdAt: Date.now(),
                },
                {
                    messageId: 'msg-2',
                    role: 'assistant',
                    content: '你好，我是...',
                    createdAt: Date.now(),
                },
            ],
        };

        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce(session);
        mockChatFile.saveSession.mockResolvedValueOnce(undefined);

        const res = await POST(dummyRequest, makeParams('session-2'));
        expect(res.status).toBe(200);

        // 应删除 assistant 消息并保存
        expect(session.messages).toHaveLength(1);
        expect(session.messages[0].role).toBe('user');
        expect(mockChatFile.saveSession).toHaveBeenCalledWith(session);
    });

    it('中断时最后一条是 user 消息不应调用 saveSession', async () => {
        const abortController = new AbortController();
        streamControllers.set('session-3', abortController);

        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce({
            sessionId: 'session-3',
            userId: 'user-1',
            messages: [
                {
                    messageId: 'msg-1',
                    role: 'user',
                    content: '你好',
                    createdAt: Date.now(),
                },
            ],
        });

        const res = await POST(dummyRequest, makeParams('session-3'));
        expect(res.status).toBe(200);
        expect(mockChatFile.saveSession).not.toHaveBeenCalled();
    });
});
