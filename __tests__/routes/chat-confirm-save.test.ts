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
        patch: (url: string, data?: unknown) => ({
            url,
            method: 'PATCH',
            data,
        }),
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
    updateToolCallContent: vi.fn(),
};
vi.mock('@/files', () => ({
    ChatFile: mockChatFile,
}));

// ---- Helpers ----

function makeRequest(body: Record<string, unknown>) {
    return new NextRequest(
        'http://localhost:3000/luoye/ai/chat/session-1/confirm-save',
        {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        },
    );
}

function makeParams(sessionId: string) {
    return { params: { sessionId } };
}

describe('POST /luoye/ai/chat/:sessionId/confirm-save', () => {
    let POST: typeof import('../../app/(apps)/luoye/ai/chat/[sessionId]/confirm-save/route').POST;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod =
            await import('../../app/(apps)/luoye/ai/chat/[sessionId]/confirm-save/route');
        POST = mod.POST;
    });

    it('正常确认应先更新后端再更新本地备份', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                sessionId: 'session-1',
                userId: 'user-1',
                messages: [],
            })
            .mockResolvedValueOnce({ sessionId: 'session-1' });
        mockChatFile.updateToolCallContent.mockResolvedValueOnce(true);

        const res = await POST(
            makeRequest({ confirmed: true, runId: 'run-1' }),
            makeParams('session-1'),
        );

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ success: true });
        expect(mockServerFetch).toHaveBeenCalledWith(
            expect.objectContaining({
                url: '/api/luoye/chat-sessions/session-1/tool-calls/run-1',
                method: 'PATCH',
                data: { status: 'confirmed' },
            }),
            false,
            false,
        );
        expect(mockChatFile.updateToolCallContent).toHaveBeenCalledWith(
            'user-1',
            'session-1',
            'run-1',
            'confirmed',
        );
    });

    it('后端更新失败应返回 500 且不更新本地备份', async () => {
        mockServerFetch
            .mockResolvedValueOnce({ id: 'user-1' })
            .mockResolvedValueOnce({
                sessionId: 'session-1',
                userId: 'user-1',
                messages: [],
            })
            .mockRejectedValueOnce(new Error('update failed'));

        const res = await POST(
            makeRequest({ confirmed: false, runId: 'run-1' }),
            makeParams('session-1'),
        );

        expect(res.status).toBe(500);
        expect(await res.json()).toMatchObject({
            message: '更新保存状态失败',
        });
        expect(mockChatFile.updateToolCallContent).not.toHaveBeenCalled();
    });
});
