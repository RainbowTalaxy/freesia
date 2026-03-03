# 单元测试使用指南

项目使用 [Vitest](https://vitest.dev/) 作为测试框架。

## 运行测试

```bash
# 运行所有测试
yarn test

# 监听模式（文件变更自动重跑）
yarn test:watch

# 运行指定文件
npx vitest run __tests__/files/FileHandler.test.ts

# 运行匹配关键字的测试
npx vitest run -t "应创建新会话"
```

## 目录结构

测试文件统一放在 `__tests__/` 目录下，按模块分子目录：

```
__tests__/
├── files/           # 文件操作层测试
│   ├── FileHandler.test.ts
│   └── ChatFile.test.ts
└── routes/          # API 路由测试
    ├── chat.test.ts
    ├── chat-delete.test.ts
    └── chat-abort.test.ts
```

## 编写测试

### 基本结构

```ts
import { describe, it, expect } from 'vitest';

describe('模块名', () => {
    it('应完成某功能', () => {
        expect(1 + 1).toBe(2);
    });
});
```

`vitest.config.ts` 已开启 `globals: true`，因此 `describe`、`it`、`expect` 等 API 可以不显式导入直接使用，但建议保留显式导入以获得更好的类型提示。

### 路径别名

配置文件中定义了路径别名 `@` → `app/`，可在测试中使用 `@/api`、`@/files` 等引用源码。

对于 Next.js 路由组目录（如 `app/(apps)/`），因为目录名含特殊字符无法通过别名访问，直接使用相对路径导入：

```ts
import { streamControllers } from '../../app/(apps)/luoye/ai/chat/state';
```

### Mock 依赖

路由测试中需要 mock 外部依赖（API 请求、文件操作、LLM 调用等）：

```ts
import { vi } from 'vitest';

// 1. 在文件顶层定义 mock 函数
const mockServerFetch = vi.fn();

// 2. mock 整个模块
vi.mock('@/api/fetch/server', () => ({
    default: (...args: unknown[]) => mockServerFetch(...args),
}));

// 3. 在 beforeEach 中清理
beforeEach(() => {
    vi.clearAllMocks();
});

// 4. 在测试中设置返回值
it('未登录应返回 401', async () => {
    mockServerFetch.mockResolvedValueOnce(null);
    // ...
});
```

### 动态导入路由

路由处理函数需要在 mock 生效后再导入，使用 `beforeEach` + 动态 `import`：

```ts
let POST: typeof import('../../app/(apps)/luoye/ai/chat/route').POST;

beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../../app/(apps)/luoye/ai/chat/route');
    POST = mod.POST;
});
```

### 测试文件系统操作

文件操作测试使用真实文件系统，需要在 `beforeEach` / `afterEach` 中清理测试目录：

```ts
import fs from 'fs/promises';

const TEST_DIR = path.join(process.cwd(), 'temp/__test_xxx');

beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
});

afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
});
```

### 测试 SSE 流式响应

对于返回 `ReadableStream` 的接口，可以读取流内容后逐个解析事件：

```ts
async function readSSEStream(response: Response): Promise<string[]> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    const events: string[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        events.push(...lines.map((l) => l.slice(6)));
    }
    return events;
}

// 使用
const events = await readSSEStream(res);
const parsed = events.map((e) => JSON.parse(e));
expect(parsed[0].type).toBe('session');
```

## 注意事项

- 测试文件命名必须以 `.test.ts` 结尾
- 文件系统测试使用 `temp/` 下的临时目录，测试后务必清理
- mock 的模块路径需使用与源码中相同的别名路径（如 `@/api/fetch/server`）
