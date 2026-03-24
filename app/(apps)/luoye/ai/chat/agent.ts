import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getMimoModel } from '../model';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { createAgent } from 'langchain';

const searchDocsTool = tool(
    async ({ keyword, workspaceId, limit }) => {
        const query: {
            keyword: string;
            workspaceId?: string;
            limit?: number;
        } = { keyword };
        if (workspaceId) query.workspaceId = workspaceId;
        if (limit !== undefined) query.limit = limit;

        const results = await serverFetch(
            API.luoye.search(query),
            true,
            false,
            { cache: 'no-store' },
        );

        if (!results || results.length === 0) {
            return '没有找到相关文档。';
        }

        return results
            .map((r) => {
                const matchTexts = r.matches
                    .map((m) => `[${m.field}] ${m.context}`)
                    .join('\n');
                return `文档「${r.name}」(ID: ${r.id})\n${matchTexts}`;
            })
            .join('\n---\n');
    },
    {
        name: 'search_docs',
        description:
            '搜索用户的文档库，根据关键词在文档标题和正文中查找匹配内容。当用户提问涉及其他文档、需要跨文档查找信息或引用时使用此工具。',
        schema: z.object({
            keyword: z
                .string()
                .describe(
                    '搜索关键词（大小写敏感，多词 AND 搜索，用空白分隔）',
                ),
            workspaceId: z.string().optional().describe('限定搜索的工作区 ID'),
            limit: z.number().optional().describe('返回结果数量上限，默认 15'),
        }),
    },
);

const readDocTool = tool(
    async ({ docId }) => {
        const doc = await serverFetch(API.luoye.doc(docId), true, false, {
            cache: 'no-store',
        });

        if (!doc) {
            return '文档不存在或无权访问。';
        }

        return `文档标题：${doc.name || '无标题'}\n文档内容：\n${doc.content || '(空)'}`;
    },
    {
        name: 'read_doc',
        description:
            '根据文档 ID 读取文档的完整内容。在通过 search_docs 搜索到相关文档后，使用此工具获取文档详情。',
        schema: z.object({
            docId: z.string().describe('要读取的文档 ID ，格式为 UUID'),
        }),
    },
);

export function createChatAgent() {
    const model = getMimoModel();
    return createAgent({
        model,
        tools: [searchDocsTool, readDocTool],
    });
}
