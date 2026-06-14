import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
    createAgent: vi.fn((config: unknown) => config),
    serverFetch: vi.fn(),
}));

vi.mock('langchain', () => ({
    createAgent: (config: unknown) => mocks.createAgent(config),
}));

vi.mock('@/api/fetch/server', () => ({
    default: (...args: unknown[]) => mocks.serverFetch(...args),
}));

vi.mock('@/api', () => ({
    default: {
        luoye: {
            search: (query: unknown) => ({ url: '/api/luoye/search', query }),
            doc: (id: string) => ({ url: `/api/luoye/doc/${id}` }),
        },
    },
}));

vi.mock('../../app/(apps)/luoye/ai/model', () => ({
    getMimoModel: () => ({}),
}));

interface TestTool {
    name: string;
    invoke: (input: unknown) => Promise<string>;
}

interface TestAgentConfig {
    tools: TestTool[];
}

async function createSearchDocsTool() {
    const { createChatAgent } =
        await import('../../app/(apps)/luoye/ai/chat/agent');
    createChatAgent();

    const lastCreateAgentCall =
        mocks.createAgent.mock.calls[mocks.createAgent.mock.calls.length - 1];
    const agentConfig = lastCreateAgentCall?.[0] as
        | TestAgentConfig
        | undefined;
    if (!agentConfig) throw new Error('createAgent config not found');

    const searchDocsTool = agentConfig.tools.find(
        (item) => item.name === 'search_docs',
    );
    if (!searchDocsTool) throw new Error('search_docs tool not found');
    return searchDocsTool;
}

describe('chat agent search_docs', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.createAgent.mockImplementation((config: unknown) => config);
    });

    it('连续三次空搜索后应在结果中提醒停止无依据枚举', async () => {
        mocks.serverFetch.mockResolvedValue({ total: 0, items: [] });
        const searchDocsTool = await createSearchDocsTool();

        await expect(searchDocsTool.invoke({ keyword: '乡村' })).resolves.toBe(
            '没有找到相关文档。',
        );
        await expect(searchDocsTool.invoke({ keyword: '山' })).resolves.toBe(
            '没有找到相关文档。',
        );
        await expect(
            searchDocsTool.invoke({ keyword: '田野' }),
        ).resolves.toContain('你已经连续 3 次搜索没有结果');
    });

    it('搜索命中结果后应重置连续空搜索计数', async () => {
        mocks.serverFetch
            .mockResolvedValueOnce({ total: 0, items: [] })
            .mockResolvedValueOnce({ total: 0, items: [] })
            .mockResolvedValueOnce({
                total: 1,
                items: [
                    {
                        id: 'doc-1',
                        name: '黄山黟县之旅',
                        matches: [{ field: 'name', context: '黄山 黟县' }],
                    },
                ],
            })
            .mockResolvedValueOnce({ total: 0, items: [] });
        const searchDocsTool = await createSearchDocsTool();

        await searchDocsTool.invoke({ keyword: '乡村' });
        await searchDocsTool.invoke({ keyword: '山' });
        await expect(
            searchDocsTool.invoke({ keyword: '黄山 黟县' }),
        ).resolves.toContain('文档「黄山黟县之旅」');
        await expect(searchDocsTool.invoke({ keyword: '田野' })).resolves.toBe(
            '没有找到相关文档。',
        );
    });

    it('搜索响应包含总数时应提示仅展示前几条', async () => {
        mocks.serverFetch.mockResolvedValueOnce({
            total: 35,
            items: [
                {
                    id: 'doc-1',
                    name: '近期笔记',
                    matches: [],
                },
            ],
        });
        const searchDocsTool = await createSearchDocsTool();

        await expect(
            searchDocsTool.invoke({
                startDate: '2026-01-01',
                endDate: '2026-06-14',
                timeField: 'updatedAt',
            }),
        ).resolves.toContain('共找到 35 个文档，展示前 1 个');
    });
});
