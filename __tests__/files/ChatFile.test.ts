import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import ChatFile, { ChatSession } from '@/files/luoye/chat';
import FileHandler from '@/files/FileHandler';

const TEST_DIR = path.join(process.cwd(), 'temp/luoye/chat');
const TEST_USER = 'test-user-001';

beforeEach(async () => {
    // 确保测试用户目录干净
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
            const session = await ChatFile.createSession(
                TEST_USER,
                'session-1',
                'doc-1',
            );

            expect(session.sessionId).toBe('session-1');
            expect(session.docId).toBe('doc-1');
            expect(session.userId).toBe(TEST_USER);
            expect(session.messages).toEqual([]);
            expect(session.createdAt).toBeTypeOf('number');
            expect(session.updatedAt).toBeTypeOf('number');
        });

        it('应将会话持久化到文件系统', async () => {
            await ChatFile.createSession(TEST_USER, 'session-2', 'doc-2');

            const filePath = path.join(TEST_DIR, TEST_USER, 'session-2.json');
            const exists = await FileHandler.exists(filePath);
            expect(exists).toBe(true);
        });
    });

    describe('getSession', () => {
        it('应读取已存在的会话', async () => {
            await ChatFile.createSession(TEST_USER, 'session-3', 'doc-3');
            const session = await ChatFile.getSession(TEST_USER, 'session-3');

            expect(session).not.toBeNull();
            expect(session!.sessionId).toBe('session-3');
        });

        it('读取不存在的会话应返回 null', async () => {
            const session = await ChatFile.getSession(TEST_USER, 'nonexistent');
            expect(session).toBeNull();
        });
    });

    describe('appendMessage', () => {
        it('应追加消息到会话', async () => {
            await ChatFile.createSession(TEST_USER, 'session-4', 'doc-4');

            const result = await ChatFile.appendMessage(
                TEST_USER,
                'session-4',
                {
                    messageId: 'msg-1',
                    role: 'user',
                    content: '你好',
                    createdAt: Date.now(),
                },
            );

            expect(result).not.toBeNull();
            expect(result!.messages).toHaveLength(1);
            expect(result!.messages[0].content).toBe('你好');
        });

        it('应能连续追加多条消息', async () => {
            await ChatFile.createSession(TEST_USER, 'session-5', 'doc-5');

            await ChatFile.appendMessage(TEST_USER, 'session-5', {
                messageId: 'msg-1',
                role: 'user',
                content: '问题',
                createdAt: Date.now(),
            });
            await ChatFile.appendMessage(TEST_USER, 'session-5', {
                messageId: 'msg-2',
                role: 'assistant',
                content: '回答',
                createdAt: Date.now(),
            });

            const session = await ChatFile.getSession(TEST_USER, 'session-5');
            expect(session!.messages).toHaveLength(2);
            expect(session!.messages[0].role).toBe('user');
            expect(session!.messages[1].role).toBe('assistant');
        });

        it('向不存在的会话追加消息应返回 null', async () => {
            const result = await ChatFile.appendMessage(
                TEST_USER,
                'nonexistent',
                {
                    messageId: 'msg-x',
                    role: 'user',
                    content: 'test',
                    createdAt: Date.now(),
                },
            );
            expect(result).toBeNull();
        });
    });

    describe('saveSession', () => {
        it('应更新 updatedAt 时间戳', async () => {
            const session = await ChatFile.createSession(
                TEST_USER,
                'session-6',
                'doc-6',
            );
            const originalUpdatedAt = session.updatedAt;

            // 等待一毫秒确保时间戳不同
            await new Promise((r) => setTimeout(r, 10));

            session.messages.push({
                messageId: 'msg-1',
                role: 'user',
                content: 'test',
                createdAt: Date.now(),
            });
            await ChatFile.saveSession(session);

            const updated = await ChatFile.getSession(TEST_USER, 'session-6');
            expect(updated!.updatedAt).toBeGreaterThan(originalUpdatedAt);
            expect(updated!.messages).toHaveLength(1);
        });
    });

    describe('deleteSession', () => {
        it('应删除已存在的会话', async () => {
            await ChatFile.createSession(TEST_USER, 'session-7', 'doc-7');
            const result = await ChatFile.deleteSession(TEST_USER, 'session-7');

            expect(result).toBe(true);

            const session = await ChatFile.getSession(TEST_USER, 'session-7');
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

    describe('cleanupSessions', () => {
        it('应删除超过 10 个的旧会话', async () => {
            // 创建 12 个会话
            for (let i = 0; i < 12; i++) {
                const session = await ChatFile.createSession(
                    TEST_USER,
                    `session-${i}`,
                    'doc-x',
                );
                // 手动设置不同的 updatedAt，让排序可预测
                session.updatedAt = Date.now() + i * 1000;
                await ChatFile.saveSession(session);
            }

            await ChatFile.cleanupSessions(TEST_USER);

            const files = await FileHandler.listFiles(
                path.join(TEST_DIR, TEST_USER),
            );
            expect(files.length).toBeLessThanOrEqual(10);
        });

        it('应删除超过 7 天的过期会话', async () => {
            // 创建一个过期会话
            const session = await ChatFile.createSession(
                TEST_USER,
                'old-session',
                'doc-old',
            );
            // 直接写入文件绕过 saveSession 的 updatedAt 重置
            session.updatedAt = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 天前
            await FileHandler.writeJSON(
                path.join(TEST_DIR, TEST_USER, 'old-session.json'),
                session,
            );

            // 创建一个新会话确保不会被删除
            await ChatFile.createSession(TEST_USER, 'new-session', 'doc-new');

            await ChatFile.cleanupSessions(TEST_USER);

            const oldSession = await ChatFile.getSession(
                TEST_USER,
                'old-session',
            );
            const newSession = await ChatFile.getSession(
                TEST_USER,
                'new-session',
            );

            expect(oldSession).toBeNull();
            expect(newSession).not.toBeNull();
        });

        it('无会话时不应报错', async () => {
            await expect(
                ChatFile.cleanupSessions(TEST_USER),
            ).resolves.not.toThrow();
        });
    });
});
