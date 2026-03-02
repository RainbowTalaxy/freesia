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
    };
    return {
        default: {
            user: { info: () => Rocket.get('/api/user') },
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
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce(null);

        const res = await DELETE(dummyRequest, makeParams('nonexistent'));
        expect(res.status).toBe(404);
    });

    it('非会话拥有者应返回 403', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce({
            sessionId: 'session-1',
            userId: 'other-user',
            messages: [],
        });

        const res = await DELETE(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(403);
    });

    it('正常删除应返回 success: true', async () => {
        mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });
        mockChatFile.getSession.mockResolvedValueOnce({
            sessionId: 'session-1',
            userId: 'user-1',
            messages: [],
        });
        mockChatFile.deleteSession.mockResolvedValueOnce(true);

        const res = await DELETE(dummyRequest, makeParams('session-1'));
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.success).toBe(true);
        expect(mockChatFile.deleteSession).toHaveBeenCalledWith(
            'user-1',
            'session-1',
        );
    });
});
