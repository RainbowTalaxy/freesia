import fs from 'fs/promises';
import path from 'path';

const FileHandler = {
    /** 读取 JSON 文件 */
    async readJSON<T>(filePath: string): Promise<T | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content) as T;
        } catch {
            return null;
        }
    },

    /** 写入 JSON 文件（自动创建目录） */
    async writeJSON(filePath: string, data: unknown): Promise<void> {
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    },

    /** 列出目录下的文件名 */
    async listFiles(dirPath: string): Promise<string[]> {
        try {
            return await fs.readdir(dirPath);
        } catch {
            return [];
        }
    },

    /** 删除文件 */
    async deleteFile(filePath: string): Promise<boolean> {
        try {
            await fs.unlink(filePath);
            return true;
        } catch {
            return false;
        }
    },

    /** 删除目录（递归） */
    async deleteDir(dirPath: string): Promise<boolean> {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
            return true;
        } catch {
            return false;
        }
    },

    /** 检查文件是否存在 */
    async exists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    },

    /** 创建目录（递归） */
    async ensureDir(dirPath: string): Promise<void> {
        await fs.mkdir(dirPath, { recursive: true });
    },
};

export default FileHandler;
