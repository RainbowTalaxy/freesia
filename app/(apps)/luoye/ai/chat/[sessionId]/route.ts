import { NextRequest, NextResponse } from 'next/server';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { ChatFile } from '@/files';

export async function DELETE(
    _request: NextRequest,
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
            { message: '无权删除该会话' },
            { status: 403 },
        );
    }

    try {
        await serverFetch(
            API.luoye.ai.chat.deleteSession(sessionId),
            false,
            false,
        );
    } catch (error) {
        console.error('[chat] Failed to delete backend session:', error);
        return NextResponse.json(
            { message: '删除会话失败' },
            { status: 500 },
        );
    }

    try {
        await ChatFile.deleteSession(userId, sessionId);
    } catch (error) {
        console.error('[chat] Failed to delete local session backup:', error);
    }

    return NextResponse.json({ success: true });
}
