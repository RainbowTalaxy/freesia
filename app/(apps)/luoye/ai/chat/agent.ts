import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getMimoModel } from '../model';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { createAgent } from 'langchain';
import { formatDocForReadDoc } from './format';

const searchDocsTool = tool(
    async ({ keyword, workspaceId, limit }) => {
        try {
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
        } catch (error) {
            console.error('[chat] search_docs failed:', error);
            return '搜索文档时发生错误，请稍后重试。';
        }
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
        try {
            const doc = await serverFetch(API.luoye.doc(docId), true, false, {
                cache: 'no-store',
            });

            if (!doc) {
                return '文档不存在或无权访问。';
            }

            return formatDocForReadDoc(doc);
        } catch (error) {
            console.error('[chat] read_doc failed:', error);
            return '读取文档时发生错误，请稍后重试。';
        }
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

const getCurrentTimeTool = tool(
    async () => {
        const now = new Date();
        const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        return (
            cst.toISOString().replace('T', ' ').replace('Z', '') + ' (UTC+8)'
        );
    },
    {
        name: 'get_current_time',
        description: '获取当前日期和时间。',
        schema: z.object({}),
    },
);

const saveDocRequestTool = tool(
    async ({ title, content }) => {
        // 非阻塞请求，返回 pending 状态；前端会显示此 tool 调用信息，由用户决定是否保存
        return JSON.stringify({ status: 'pending', title, content });
    },
    {
        name: 'save_doc_request',
        description:
            '发起文档保存请求。将整理好的标题和 Markdown 内容发送给用户，由用户在页面上确认是否保存为文档。调用此工具后不会立即保存，需等待用户点击确认。',
        schema: z.object({
            title: z.string().describe('文档标题'),
            content: z
                .string()
                .describe(
                    '文档内容，Markdown 格式，不要包含一级标题（# 标题）',
                ),
        }),
    },
);

export function createChatAgent(options?: { multimodal?: boolean }) {
    const model = getMimoModel(options);
    return createAgent({
        model,
        tools: [
            searchDocsTool,
            readDocTool,
            saveDocRequestTool,
            getCurrentTimeTool,
        ],
    });
}
