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

    const session = await ChatFile.getSession(userId, sessionId);
    if (!session) {
        return NextResponse.json({ message: '会话不存在' }, { status: 404 });
    }

    if (session.userId !== userId) {
        return NextResponse.json(
            { message: '无权删除该会话' },
            { status: 403 },
        );
    }

    await ChatFile.deleteSession(userId, sessionId);

    return NextResponse.json({ success: true });
}
