import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import ChatFile, { ChatSession, convertMessages } from '@/files/luoye/chat';
import FileHandler from '@/files/FileHandler';
import { HumanMessage, AIMessage, ToolMessage } from 'langchain';

const TEST_DIR = path.join(process.cwd(), 'temp/luoye/chat');
const TEST_USER = 'test-user-001';

beforeEach(async () => {
    await fs.rm(path.join(TEST_DIR, TEST_USER), {
        recursive: true,
        force: true,
    });
});

afterEach(async () => {
    await fs.rm(path.join(TEST_DIR, TEST_USER), {
        recursive: true,
        force: true,
    });
    vi.restoreAllMocks();
});

describe('ChatFile', () => {
    describe('createSession', () => {
        it('应创建新会话并返回正确结构', async () => {
            const docUpdatedAt = Date.now();
            const session = await ChatFile.createSession(
                TEST_USER,
                'doc-1',
                docUpdatedAt,
            );

            expect(session.sessionId).toBeTypeOf('string');
            expect(session.sessionId.length).toBeGreaterThan(0);
            expect(session.docId).toBe('doc-1');
            expect(session.userId).toBe(TEST_USER);
            expect(session.docUpdatedAt).toBe(docUpdatedAt);
            expect(session.messages).toEqual([]);
            expect(session.createdAt).toBeTypeOf('number');
            expect(session.updatedAt).toBeTypeOf('number');
        });

        it('应将会话持久化到文件系统', async () => {
            const session = await ChatFile.createSession(
                TEST_USER,
                'doc-2',
                Date.now(),
            );

            const filePath = path.join(
                TEST_DIR,
                TEST_USER,
                `${session.sessionId}.json`,
            );
            const exists = await FileHandler.exists(filePath);
            expect(exists).toBe(true);
        });

        it('每次创建的 sessionId 应唯一', async () => {
            const s1 = await ChatFile.createSession(
                TEST_USER,
                'doc-a',
                Date.now(),
            );
            const s2 = await ChatFile.createSession(
                TEST_USER,
                'doc-b',
                Date.now(),
            );
            expect(s1.sessionId).not.toBe(s2.sessionId);
        });
    });

    describe('getSession', () => {
        it('应读取已存在的会话', async () => {
            const created = await ChatFile.createSession(
                TEST_USER,
                'doc-3',
                Date.now(),
            );
            const session = await ChatFile.getSession(
                TEST_USER,
                created.sessionId,
            );

            expect(session).not.toBeNull();
            expect(session!.sessionId).toBe(created.sessionId);
            expect(session!.docId).toBe('doc-3');
        });

        it('读取不存在的会话应返回 null', async () => {
            const session = await ChatFile.getSession(TEST_USER, 'nonexistent');
            expect(session).toBeNull();
        });
    });

    describe('appendUserMessage', () => {
        it('应追加用户消息到会话', async () => {
            const created = await ChatFile.createSession(
                TEST_USER,
                'doc-4',
                Date.now(),
            );

            const result = await ChatFile.appendUserMessage(
                TEST_USER,
                created.sessionId,
                '你好',
            );

            expect(result).not.toBeNull();
            expect(result!.messages).toHaveLength(1);
            expect(result!.messages[0].role).toBe('user');
            expect(result!.messages[0].content).toBe('你好');
        });

        it('应自动生成 messageId 和 createdAt', async () => {
            const created = await ChatFile.createSession(
                TEST_USER,
                'doc-4b',
                Date.now(),
            );

            const result = await ChatFile.appendUserMessage(
                TEST_USER,
                created.sessionId,
                'test',
            );

            const msg = result!.messages[0];
            expect(msg.role).toBe('user');
            if (msg.role === 'user') {
                expect(msg.messageId).toBeTypeOf('string');
                expect(msg.createdAt).toBeTypeOf('number');
            }
        });

        it('纯图片首条消息应使用图片名生成标题', async () => {
            const created = await ChatFile.createSession(
                TEST_USER,
                'doc-4c',
                Date.now(),
            );

            const result = await ChatFile.appendUserMessage(
                TEST_USER,
                created.sessionId,
                '',
                [
                    {
                        id: 'image-1',
                        url: 'https://blog.talaxy.cn/statics/temp/luoye/cat.png',
                        name: 'cat.png',
                        mimeType: 'image/png',
                        size: 123,
                    },
                ],
            );

            expect(result!.title).toBe('图片：cat.png');
        });

        it('向不存在的会话追加消息应返回 null', async () => {
            const result = await ChatFile.appendUserMessage(
                TEST_USER,
                'nonexistent',
                'test',
            );
            expect(result).toBeNull();
        });
    });

    describe('appendAssistantMessage', () => {
        it('应追加助手消息到会话', async () => {
            const created = await ChatFile.createSession(
                TEST_USER,
                'doc-5',
                Date.now(),
            );

            const assistantMsg = ChatFile.newAssistantMessage();
            const chatMsg = ChatFile.newAssistantChatMessage();
            chatMsg.content = '你好，有什么可以帮你的？';
            assistantMsg.content.push(chatMsg);

            const result = await ChatFile.appendAssistantMessage(
                TEST_USER,
                created.sessionId,
                assistantMsg,
            );

            expect(result).not.toBeNull();
            expect(result!.messages).toHaveLength(1);
            expect(result!.messages[0].role).toBe('assistant');
        });

        it('助手消息应包含聊天子消息和工具调用子消息', async () => {
            const created = await ChatFile.createSession(
                TEST_USER,
                'doc-5b',
                Date.now(),
            );

            const assistantMsg = ChatFile.newAssistantMessage();

            // 添加一个带工具调用的聊天子消息
            const chatMsg = ChatFile.newAssistantChatMessage();
            chatMsg.content = '让我查一下';
            chatMsg.toolCalls = [
                { id: 'tc-1', name: 'search', args: { query: 'test' } },
            ];
            assistantMsg.content.push(chatMsg);

            // 添加工具调用结果
            const toolMsg = ChatFile.newToolCallMessage();
            toolMsg.toolCallId = 'tc-1';
            toolMsg.name = 'search';
            toolMsg.args = { query: 'test' };
            toolMsg.output = '搜索结果';
            toolMsg.content = '搜索结果';
            assistantMsg.content.push(toolMsg);

            // 添加最终回复
            const finalMsg = ChatFile.newAssistantChatMessage();
            finalMsg.content = '搜索完成，结果如下...';
            assistantMsg.content.push(finalMsg);

            const result = await ChatFile.appendAssistantMessage(
                TEST_USER,
                created.sessionId,
                assistantMsg,
            );

            expect(result).not.toBeNull();
            const msg = result!.messages[0];
            expect(msg.role).toBe('assistant');
            if (msg.role === 'assistant') {
                expect(msg.content).toHaveLength(3);
                expect(msg.content[0].role).toBe('assistant');
                expect(msg.content[1].role).toBe('tool');
                expect(msg.content[2].role).toBe('assistant');
            }
        });

        it('应能连续追加用户和助手消息', async () => {
            const created = await ChatFile.createSession(
                TEST_USER,
                'doc-5c',
                Date.now(),
            );

            await ChatFile.appendUserMessage(
                TEST_USER,
                created.sessionId,
                '问题',
            );

            const assistantMsg = ChatFile.newAssistantMessage();
            const chatMsg = ChatFile.newAssistantChatMessage();
            chatMsg.content = '回答';
            assistantMsg.content.push(chatMsg);
            await ChatFile.appendAssistantMessage(
                TEST_USER,
                created.sessionId,
                assistantMsg,
            );

            const session = await ChatFile.getSession(
                TEST_USER,
                created.sessionId,
            );
            expect(session!.messages).toHaveLength(2);
            expect(session!.messages[0].role).toBe('user');
            expect(session!.messages[1].role).toBe('assistant');
        });

        it('向不存在的会话追加助手消息应返回 null', async () => {
            const assistantMsg = ChatFile.newAssistantMessage();
            const result = await ChatFile.appendAssistantMessage(
                TEST_USER,
                'nonexistent',
                assistantMsg,
            );
            expect(result).toBeNull();
        });
    });

    describe('helper methods', () => {
        it('generateMessageId 应返回唯一字符串', () => {
            const id1 = ChatFile.generateMessageId();
            const id2 = ChatFile.generateMessageId();
            expect(id1).toBeTypeOf('string');
            expect(id1).not.toBe(id2);
        });

        it('newAssistantMessage 应返回正确结构', () => {
            const msg = ChatFile.newAssistantMessage();
            expect(msg.role).toBe('assistant');
            expect(msg.content).toEqual([]);
            expect(msg.messageId).toBeTypeOf('string');
            expect(msg.createdAt).toBeTypeOf('number');
        });

        it('newAssistantChatMessage 应返回正确结构', () => {
            const msg = ChatFile.newAssistantChatMessage();
            expect(msg.role).toBe('assistant');
            expect(msg.content).toBe('');
            expect(msg.messageId).toBeTypeOf('string');
            expect(msg.createdAt).toBeTypeOf('number');
        });

        it('newToolCallMessage 应返回正确结构', () => {
            const msg = ChatFile.newToolCallMessage();
            expect(msg.role).toBe('tool');
            expect(msg.toolCallId).toBeTypeOf('string');
            expect(msg.name).toBe('');
            expect(msg.args).toEqual({});
            expect(msg.input).toBe('');
            expect(msg.output).toBe('');
            expect(msg.content).toBe('');
            expect(msg.createdAt).toBeTypeOf('number');
        });
    });

    describe('saveSession', () => {
        it('应更新 updatedAt 时间戳', async () => {
            const session = await ChatFile.createSession(
                TEST_USER,
                'doc-6',
                Date.now(),
            );
            const originalUpdatedAt = session.updatedAt;

            await new Promise((r) => setTimeout(r, 10));

            session.messages.push({
                messageId: ChatFile.generateMessageId(),
                role: 'user',
                content: 'test',
                createdAt: Date.now(),
            });
            await ChatFile.saveSession(session);

            const updated = await ChatFile.getSession(
                TEST_USER,
                session.sessionId,
            );
            expect(updated!.updatedAt).toBeGreaterThan(originalUpdatedAt);
            expect(updated!.messages).toHaveLength(1);
        });
    });

    describe('deleteSession', () => {
        it('应删除已存在的会话', async () => {
            const created = await ChatFile.createSession(
                TEST_USER,
                'doc-7',
                Date.now(),
            );
            const result = await ChatFile.deleteSession(
                TEST_USER,
                created.sessionId,
            );

            expect(result).toBe(true);

            const session = await ChatFile.getSession(
                TEST_USER,
                created.sessionId,
            );
            expect(session).toBeNull();
        });

        it('删除不存在的会话应返回 false', async () => {
            const result = await ChatFile.deleteSession(
                TEST_USER,
                'nonexistent',
            );
            expect(result).toBe(false);
        });
    });

    describe('listSessions and updateSession', () => {
        it('应按 updatedAt 倒序返回会话摘要', async () => {
            const first = await ChatFile.createSession(TEST_USER, 'doc-a');
            const second = await ChatFile.createSession(TEST_USER, 'doc-a');

            await FileHandler.writeJSON(
                path.join(TEST_DIR, TEST_USER, `${first.sessionId}.json`),
                { ...first, updatedAt: 1000 },
            );
            await FileHandler.writeJSON(
                path.join(TEST_DIR, TEST_USER, `${second.sessionId}.json`),
                { ...second, updatedAt: 2000 },
            );

            const sessions = await ChatFile.listSessions(TEST_USER);
            expect(sessions.map((session) => session.sessionId)).toEqual([
                second.sessionId,
                first.sessionId,
            ]);
        });

        it('应按 docId 过滤会话列表', async () => {
            const docSession = await ChatFile.createSession(TEST_USER, 'doc-a');
            await ChatFile.createSession(TEST_USER, 'doc-b');

            const sessions = await ChatFile.listSessions(TEST_USER, {
                docId: 'doc-a',
            });
            expect(sessions).toHaveLength(1);
            expect(sessions[0].sessionId).toBe(docSession.sessionId);
        });

        it('应支持 limit 限制返回数量', async () => {
            await ChatFile.createSession(TEST_USER, 'doc-a');
            await ChatFile.createSession(TEST_USER, 'doc-a');
            await ChatFile.createSession(TEST_USER, 'doc-a');

            const sessions = await ChatFile.listSessions(TEST_USER, {
                limit: 2,
            });
            expect(sessions).toHaveLength(2);
        });

        it('应兼容缺少 title 和 schemaVersion 的旧会话', async () => {
            await FileHandler.writeJSON(
                path.join(TEST_DIR, TEST_USER, 'legacy-session.json'),
                {
                    sessionId: 'legacy-session',
                    userId: TEST_USER,
                    messages: [
                        {
                            messageId: 'msg-1',
                            role: 'user',
                            content: '这是一条旧会话消息',
                            createdAt: 1000,
                        },
                    ],
                    createdAt: 1000,
                    updatedAt: 2000,
                },
            );

            const session = await ChatFile.getSession(
                TEST_USER,
                'legacy-session',
            );
            expect(session!.schemaVersion).toBe(1);
            expect(session!.title).toBe('这是一条旧会话消息');

            const sessions = await ChatFile.listSessions(TEST_USER);
            expect(sessions[0].title).toBe('这是一条旧会话消息');
            expect(sessions[0].messageCount).toBe(1);
        });

        it('应更新会话标题', async () => {
            const session = await ChatFile.createSession(TEST_USER, 'doc-a');

            const updated = await ChatFile.updateSession(
                TEST_USER,
                session.sessionId,
                { title: '新的标题' },
            );

            expect(updated!.title).toBe('新的标题');
        });

        it('删除会话后列表中不再出现该会话', async () => {
            const session = await ChatFile.createSession(TEST_USER, 'doc-a');
            await ChatFile.deleteSession(TEST_USER, session.sessionId);

            const sessions = await ChatFile.listSessions(TEST_USER);
            expect(
                sessions.some((item) => item.sessionId === session.sessionId),
            ).toBe(false);
        });
    });

    describe('cleanupSessions', () => {
        it('应删除超过 10 个的旧会话', async () => {
            const sessions: ChatSession[] = [];
            for (let i = 0; i < 12; i++) {
                const session = await ChatFile.createSession(
                    TEST_USER,
                    'doc-x',
                    Date.now(),
                );
                session.updatedAt = Date.now() + i * 1000;
                await ChatFile.saveSession(session);
                sessions.push(session);
            }

            await ChatFile.cleanupSessions(TEST_USER);

            const files = await FileHandler.listFiles(
                path.join(TEST_DIR, TEST_USER),
            );
            expect(files.length).toBeLessThanOrEqual(10);
        });

        it('应删除超过 7 天的过期会话', async () => {
            // 创建一个过期会话
            const oldSession = await ChatFile.createSession(
                TEST_USER,
                'doc-old',
                Date.now(),
            );
            oldSession.updatedAt = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 天前
            await FileHandler.writeJSON(
                path.join(TEST_DIR, TEST_USER, `${oldSession.sessionId}.json`),
                oldSession,
            );

            // 创建一个新会话确保不会被删除
            const newSession = await ChatFile.createSession(
                TEST_USER,
                'doc-new',
                Date.now(),
            );

            await ChatFile.cleanupSessions(TEST_USER);

            const deletedSession = await ChatFile.getSession(
                TEST_USER,
                oldSession.sessionId,
            );
            const keptSession = await ChatFile.getSession(
                TEST_USER,
                newSession.sessionId,
            );

            expect(deletedSession).toBeNull();
            expect(keptSession).not.toBeNull();
        });

        it('无会话时不应报错', async () => {
            await expect(
                ChatFile.cleanupSessions(TEST_USER),
            ).resolves.not.toThrow();
        });
    });

    describe('convertMessages', () => {
        it('应将用户消息转换为 HumanMessage', () => {
            const result = convertMessages([
                {
                    messageId: 'msg-1',
                    role: 'user',
                    content: '你好',
                    createdAt: Date.now(),
                },
            ]);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(HumanMessage);
            expect(result[0].content).toBe('你好');
        });

        it('应将助手聊天消息转换为 AIMessage', () => {
            const result = convertMessages([
                {
                    messageId: 'msg-2',
                    role: 'assistant',
                    content: [
                        {
                            messageId: 'sub-1',
                            role: 'assistant',
                            content: '回答内容',
                            createdAt: Date.now(),
                        },
                    ],
                    createdAt: Date.now(),
                },
            ]);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(AIMessage);
            expect(result[0].content).toBe('回答内容');
        });

        it('应将工具调用消息转换为 ToolMessage', () => {
            const result = convertMessages([
                {
                    messageId: 'msg-3',
                    role: 'assistant',
                    content: [
                        {
                            messageId: 'sub-1',
                            role: 'assistant',
                            content: '',
                            toolCalls: [
                                {
                                    id: 'tc-1',
                                    name: 'search',
                                    args: { q: 'test' },
                                },
                            ],
                            createdAt: Date.now(),
                        },
                        {
                            toolCallId: 'tc-1',
                            runId: 'run-1',
                            role: 'tool',
                            name: 'search',
                            args: { q: 'test' },
                            input: '',
                            output: '结果',
                            content: '结果',
                            createdAt: Date.now(),
                        },
                    ],
                    createdAt: Date.now(),
                },
            ]);

            expect(result).toHaveLength(2);
            expect(result[0]).toBeInstanceOf(AIMessage);
            expect(result[1]).toBeInstanceOf(ToolMessage);
            expect(result[1].content).toBe('结果');
        });

        it('应正确转换完整的多轮对话', () => {
            const result = convertMessages([
                {
                    messageId: 'msg-1',
                    role: 'user',
                    content: '帮我搜索',
                    createdAt: Date.now(),
                },
                {
                    messageId: 'msg-2',
                    role: 'assistant',
                    content: [
                        {
                            messageId: 'sub-1',
                            role: 'assistant',
                            content: '好的，让我搜索一下',
                            toolCalls: [
                                {
                                    id: 'tc-1',
                                    name: 'search',
                                    args: { q: '关键词' },
                                },
                            ],
                            createdAt: Date.now(),
                        },
                        {
                            toolCallId: 'tc-1',
                            runId: 'run-1',
                            role: 'tool',
                            name: 'search',
                            args: { q: '关键词' },
                            input: '',
                            output: '找到了',
                            content: '找到了',
                            createdAt: Date.now(),
                        },
                        {
                            messageId: 'sub-2',
                            role: 'assistant',
                            content: '搜索完成，结果是...',
                            createdAt: Date.now(),
                        },
                    ],
                    createdAt: Date.now(),
                },
                {
                    messageId: 'msg-3',
                    role: 'user',
                    content: '谢谢',
                    createdAt: Date.now(),
                },
            ]);

            expect(result).toHaveLength(5);
            expect(result[0]).toBeInstanceOf(HumanMessage);
            expect(result[1]).toBeInstanceOf(AIMessage);
            expect(result[2]).toBeInstanceOf(ToolMessage);
            expect(result[3]).toBeInstanceOf(AIMessage);
            expect(result[4]).toBeInstanceOf(HumanMessage);
        });

        it('空消息列表应返回空数组', () => {
            const result = convertMessages([]);
            expect(result).toEqual([]);
        });
    });
});
