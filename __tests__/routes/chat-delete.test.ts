import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---- Mocks ----

const mockServerFetch = vi.fn();
vi.mock('@/api/fetch/server', () => ({
    default: (...args: unknown[]) => mockServerFetch(...args),
}));

vi.mock('@/api', () => {
    const Rocket = {
        get: (url: string) => ({ url, method: 'GET' }),
        delete: (url: string) => ({ url, method: 'DELETE' }),
    };
    return {
        default: {
            user: { info: () => Rocket.get('/api/user') },
            luoye: {
                ai: {
                    chat: {
                        getSession: (sessionId: string) =>
                            Rocket.get(
                                `/api/luoye/chat-sessions/${sessionId}`,
                            ),
                        deleteSession: (sessionId: string) =>
                            Rocket.delete(
                                `/api/luoye/chat-sessions/${sessionId}`,
                            ),
                    },
                },
            },
        },
    };
});

const mockChatFile = {
    getSession: vi.fn(),
    deleteSession: vi.fn(),
};
vi.mock('@/files', () => ({
    ChatFile: mockChatFile,
}));

// ---- Helpers ----

function makeParams(sessionId: string) {
    return { params: { sessionId } };
}

const dummyRequest = new NextRequest('http://localhost:3000', {
    method: 'DELETE',
});

// ---- Tests ----

describe('DELETE /luoye/ai/chat/:sessionId (删除会话)', () => {
    let DELETE: typeof import('../../app/(apps)/luoye/ai/chat/[sessionId]/route').DELETE;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod =
            await import('../../app/(apps)/luoye/ai/chat/[sessionId]/route');
        DELETE = mod.DELETE;
    });

    it('未登录应返回 401', async () => {
        mockServerFetch.mockResolvedValueOnce(null);

        const res = await DELETE(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(401);
    });

    it('会话不存在应返回 404', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce(null);

        const res = await DELETE(dummyRequest, makeParams('nonexistent'));
        expect(res.status).toBe(404);
    });

    it('非会话拥有者应返回 403', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                sessionId: 'session-1',
                userId: 'other-user',
                messages: [],
            });

        const res = await DELETE(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(403);
    });

    it('正常删除应返回 success: true', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                sessionId: 'session-1',
                userId: 'user-1',
                messages: [],
            })
            .mockResolvedValueOnce({ success: true });
        mockChatFile.deleteSession.mockResolvedValueOnce(true);

        const res = await DELETE(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.success).toBe(true);
        expect(mockServerFetch).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/api/luoye/chat-sessions/session-1',
                method: 'DELETE',
            }),
            false,
            false,
        );
        expect(mockChatFile.deleteSession).toHaveBeenCalledWith(
            'user-1',
            'session-1',
        );
    });

    it('后端删除失败应返回 500 且不删除本地备份', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                sessionId: 'session-1',
                userId: 'user-1',
                messages: [],
            })
            .mockRejectedValueOnce(new Error('delete failed'));

        const res = await DELETE(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(500);
        expect(await res.json()).toMatchObject({
            message: '删除会话失败',
        });
        expect(mockChatFile.deleteSession).not.toHaveBeenCalled();
    });
});
