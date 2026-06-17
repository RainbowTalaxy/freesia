import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getMimoModel } from '../model';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import type {
    SearchDocsQuery,
    SearchDocsResponse,
    SearchResultItem,
} from '@/api/luoye';
import { createAgent } from 'langchain';
import { formatDocForReadDoc } from './format';
import { formatEmptySearchResult } from './searchResult';

const SEARCH_TIME_FIELDS = ['updatedAt', 'createdAt', 'date'] as const;

function getRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    return value as Record<string, unknown>;
}

function normalizeSearchMatches(
    value: unknown,
): SearchResultItem['matches'] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((item) => {
        const record = getRecord(item);
        if (!record) return [];
        const { field, context } = record;
        if (
            (field !== 'name' && field !== 'content') ||
            typeof context !== 'string'
        ) {
            return [];
        }
        return [{ field, context }];
    });
}

function normalizeSearchItem(value: unknown): SearchResultItem | null {
    const record = getRecord(value);
    if (!record || typeof record.id !== 'string') return null;

    return {
        id: record.id,
        name: typeof record.name === 'string' ? record.name : '未命名文档',
        updatedAt:
            typeof record.updatedAt === 'number' ? record.updatedAt : 0,
        matches: normalizeSearchMatches(record.matches),
    };
}

function normalizeSearchResponse(value: unknown): SearchDocsResponse | null {
    const record = getRecord(value);
    const rawItems = Array.isArray(value) ? value : record?.items;
    if (!Array.isArray(rawItems)) return null;

    const items = rawItems.flatMap((item) => {
        const normalized = normalizeSearchItem(item);
        return normalized ? [normalized] : [];
    });
    const total =
        !Array.isArray(value) && typeof record?.total === 'number'
            ? record.total
            : items.length;

    return { total, items };
}

function createSearchDocsTool() {
    let consecutiveEmptySearchCount = 0;

    return tool(
        async ({
            keyword,
            workspaceId,
            limit,
            timeField,
            startDate,
            endDate,
        }) => {
            try {
                const query: SearchDocsQuery = {};
                if (keyword !== undefined) query.keyword = keyword;
                if (workspaceId) query.workspaceId = workspaceId;
                if (limit !== undefined) query.limit = limit;
                if (timeField) query.timeField = timeField;
                if (startDate) query.startDate = startDate;
                if (endDate) query.endDate = endDate;

                const results = normalizeSearchResponse(
                    await serverFetch(
                        API.luoye.search(query),
                        true,
                        false,
                        { cache: 'no-store' },
                    ),
                );

                if (!results || results.items.length === 0) {
                    consecutiveEmptySearchCount += 1;
                    return formatEmptySearchResult(consecutiveEmptySearchCount);
                }

                consecutiveEmptySearchCount = 0;
                const resultText = results.items
                    .map((r) => {
                        const matchTexts = r.matches
                            .map((m) => `[${m.field}] ${m.context}`)
                            .join('\n');
                        return matchTexts
                            ? `文档「${r.name}」(ID: ${r.id})\n${matchTexts}`
                            : `文档「${r.name}」(ID: ${r.id})`;
                    })
                    .join('\n---\n');
                if (results.total > results.items.length) {
                    return `共找到 ${results.total} 个文档，展示前 ${results.items.length} 个。\n---\n${resultText}`;
                }
                return resultText;
            } catch (error) {
                console.error('[chat] search_docs failed:', error);
                consecutiveEmptySearchCount = 0;
                return '搜索文档时发生错误，请稍后重试。';
            }
        },
        {
            name: 'search_docs',
            description:
                '搜索用户的文档库，根据关键词在文档标题和正文中查找匹配内容。当用户提问涉及其他文档、需要跨文档查找信息或引用，或需要按日期范围检索文档时使用此工具。',
            schema: z.object({
                keyword: z
                    .string()
                    .optional()
                    .describe(
                        '搜索关键词（大小写敏感，多词 AND 搜索，用空白分隔）；不传或为空时返回筛选范围内的文档列表',
                    ),
                workspaceId: z.string().optional().describe('限定搜索的工作区 ID'),
                limit: z.number().optional().describe('返回明细数量上限，默认 30，最大 30'),
                timeField: z
                    .enum(SEARCH_TIME_FIELDS)
                    .optional()
                    .describe(
                        '时间筛选字段，默认 updatedAt；date 表示文档所属日期，createdAt 表示创建时间，updatedAt 表示更新时间',
                    ),
                startDate: z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}$/)
                    .optional()
                    .describe('开始日期，格式 YYYY-MM-DD，包含当天'),
                endDate: z
                    .string()
                    .regex(/^\d{4}-\d{2}-\d{2}$/)
                    .optional()
                    .describe('结束日期，格式 YYYY-MM-DD，包含当天'),
            }),
        },
    );
}

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
            createSearchDocsTool(),
            readDocTool,
            saveDocRequestTool,
            getCurrentTimeTool,
        ],
    });
}
