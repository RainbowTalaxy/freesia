import { NextRequest, NextResponse } from 'next/server';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { ChatFile } from '@/files';
import { streamControllers } from '../../state';

export async function POST(
    _request: NextRequest,
    { params }: { params: { sessionId: string } },
) {
    const user = await serverFetch(API.user.info(), true);
    if (!user) {
        return NextResponse.json({ message: '未登录' }, { status: 401 });
    }

    const { sessionId } = params;
    const userId = user.id;

    const backendSession = await serverFetch(
        API.luoye.ai.chat.getSession(sessionId),
        true,
        false,
    );
    if (!backendSession) {
        return NextResponse.json({ message: '会话不存在' }, { status: 404 });
    }

    if (backendSession.userId !== userId) {
        return NextResponse.json(
            { message: '无权操作该会话' },
            { status: 403 },
        );
    }

    const controller = streamControllers.get(sessionId);
    if (!controller) {
        return NextResponse.json(
            { message: '没有进行中的响应' },
            { status: 404 },
        );
    }

    // 中断流式响应
    controller.abort();
    streamControllers.delete(sessionId);

    // 恢复会话状态：删除最后一条未完成的 assistant 消息
    const session = await ChatFile.getSession(userId, sessionId);
    if (!session) return NextResponse.json({ success: true });

    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
        // 用户消息已写入，但 assistant 还没写入（正在流式中），无需删除
    }
    // 如果最后一条是 assistant（部分写入的情况），删除它
    if (lastMessage && lastMessage.role === 'assistant') {
        session.messages.pop();
        await ChatFile.saveSession(session);
    }

    return NextResponse.json({ success: true });
}
