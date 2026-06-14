import { NextRequest, NextResponse } from 'next/server';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { ChatFile } from '@/files';

export async function POST(
    request: NextRequest,
    { params }: { params: { sessionId: string } },
) {
    const user = await serverFetch(API.user.info(), true);
    if (!user) {
        return NextResponse.json({ message: '未登录' }, { status: 401 });
    }

    const { sessionId } = params;
    const userId = user.id;

    const session = await serverFetch(
        API.luoye.ai.chat.getSession(sessionId),
        true,
        false,
    );
    if (!session) {
        return NextResponse.json({ message: '会话不存在' }, { status: 404 });
    }

    if (session.userId !== userId) {
        return NextResponse.json(
            { message: '无权操作该会话' },
            { status: 403 },
        );
    }

    const body = await request.json();
    const { confirmed, runId } = body as { confirmed: boolean; runId: string };

    if (typeof confirmed !== 'boolean' || !runId) {
        return NextResponse.json({ message: '缺少必填参数' }, { status: 400 });
    }

    const status = confirmed ? 'confirmed' : 'cancelled';
    try {
        await serverFetch(
            API.luoye.ai.chat.updateToolCall(sessionId, runId, { status }),
            false,
            false,
        );
    } catch (error) {
        console.error('[chat] Failed to update backend tool call:', error);
        return NextResponse.json(
            { message: '更新保存状态失败' },
            { status: 500 },
        );
    }
    try {
        await ChatFile.updateToolCallContent(userId, sessionId, runId, status);
    } catch (error) {
        console.error('[chat] Failed to update local tool call backup:', error);
    }

    return NextResponse.json({ success: true });
}
