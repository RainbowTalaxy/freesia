import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import FileHandler from '@/files/FileHandler';

const TEST_DIR = path.join(process.cwd(), 'temp/__test_filehandler');

beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('FileHandler', () => {
    describe('writeJSON / readJSON', () => {
        it('应能写入并读取 JSON 文件', async () => {
            const filePath = path.join(TEST_DIR, 'data.json');
            const data = { name: 'test', value: 42 };

            await FileHandler.writeJSON(filePath, data);
            const result = await FileHandler.readJSON<typeof data>(filePath);

            expect(result).toEqual(data);
        });

        it('应自动创建嵌套目录', async () => {
            const filePath = path.join(TEST_DIR, 'a/b/c/data.json');
            await FileHandler.writeJSON(filePath, { ok: true });

            const result = await FileHandler.readJSON<{ ok: boolean }>(
                filePath,
            );
            expect(result).toEqual({ ok: true });
        });

        it('读取不存在的文件应返回 null', async () => {
            const result = await FileHandler.readJSON(
                path.join(TEST_DIR, 'nonexistent.json'),
            );
            expect(result).toBeNull();
        });

        it('读取非法 JSON 文件应返回 null', async () => {
            const filePath = path.join(TEST_DIR, 'bad.json');
            await fs.writeFile(filePath, 'not-json', 'utf-8');

            const result = await FileHandler.readJSON(filePath);
            expect(result).toBeNull();
        });
    });

    describe('listFiles', () => {
        it('应列出目录下所有文件', async () => {
            await FileHandler.writeJSON(path.join(TEST_DIR, 'a.json'), {});
            await FileHandler.writeJSON(path.join(TEST_DIR, 'b.json'), {});

            const files = await FileHandler.listFiles(TEST_DIR);
            expect(files.sort()).toEqual(['a.json', 'b.json']);
        });

        it('目录不存在时应返回空数组', async () => {
            const files = await FileHandler.listFiles(
                path.join(TEST_DIR, 'nonexistent'),
            );
            expect(files).toEqual([]);
        });
    });

    describe('deleteFile', () => {
        it('应成功删除文件并返回 true', async () => {
            const filePath = path.join(TEST_DIR, 'to-delete.json');
            await FileHandler.writeJSON(filePath, {});

            const result = await FileHandler.deleteFile(filePath);
            expect(result).toBe(true);

            const exists = await FileHandler.exists(filePath);
            expect(exists).toBe(false);
        });

        it('删除不存在的文件应返回 false', async () => {
            const result = await FileHandler.deleteFile(
                path.join(TEST_DIR, 'nonexistent.json'),
            );
            expect(result).toBe(false);
        });
    });

    describe('deleteDir', () => {
        it('应递归删除目录', async () => {
            const subDir = path.join(TEST_DIR, 'sub');
            await FileHandler.writeJSON(path.join(subDir, 'file.json'), {});

            const result = await FileHandler.deleteDir(subDir);
            expect(result).toBe(true);

            const exists = await FileHandler.exists(subDir);
            expect(exists).toBe(false);
        });
    });

    describe('exists', () => {
        it('文件存在时应返回 true', async () => {
            const filePath = path.join(TEST_DIR, 'exists.json');
            await FileHandler.writeJSON(filePath, {});

            expect(await FileHandler.exists(filePath)).toBe(true);
        });

        it('文件不存在时应返回 false', async () => {
            expect(
                await FileHandler.exists(path.join(TEST_DIR, 'no.json')),
            ).toBe(false);
        });
    });

    describe('ensureDir', () => {
        it('应递归创建目录', async () => {
            const dir = path.join(TEST_DIR, 'x/y/z');
            await FileHandler.ensureDir(dir);

            expect(await FileHandler.exists(dir)).toBe(true);
        });
    });
});
