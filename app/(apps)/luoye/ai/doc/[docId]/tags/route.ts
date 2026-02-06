import { NextRequest, NextResponse } from 'next/server';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { getMimoModel } from '../../../model';

export async function POST(
    _request: NextRequest,
    { params }: { params: { docId: string } },
) {
    const user = await serverFetch(API.user.info(), true);
    if (!user) {
        return NextResponse.json({ message: '未登录' }, { status: 401 });
    }

    const doc = await serverFetch(API.luoye.doc(params.docId), true);
    if (!doc) {
        return NextResponse.json({ message: '文档不存在' }, { status: 404 });
    }

    const prompt = `你是一个专业的语文老师和内容标注师。请根据以下文档的标题和内容，生成标签。

要求：
- 标签数量：数量 1 到 4 个（根据文档内容篇幅），需包含至少 1 个泛化标签，放在标签列表的第 1 位；
- 标签风格：简洁精炼，以 1 到 4 字为主，无特殊符号、无冗余词汇，避免一句话式标签；
- 仅返回 JSON 数组格式，参考 "["标签1", "标签2"]" 的格式，不要返回任何其他内容。

文档标题：《${doc.name || '无标题'}》
文档内容：
${doc.content || '无内容'}`;

    const model = getMimoModel();
    const response = await model.invoke(prompt);
    const content =
        typeof response.content === 'string' ? response.content : '';

    try {
        const tags = JSON.parse(content) as string[];
        return NextResponse.json({ tags: tags.slice(0, 5) });
    } catch {
        return NextResponse.json(
            { message: '标签生成失败', raw: content },
            { status: 500 },
        );
    }
}
