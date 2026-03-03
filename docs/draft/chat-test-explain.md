# Chat Route 测试文件详解

本文档详细解读 `__tests__/routes/chat.test.ts` 测试文件，帮助理解 Vitest 测试框架的使用方式和测试逻辑。

---

## 一、总体概述

### 1.1 测试目标

这个测试文件针对 **AI 聊天接口** (`POST /luoye/ai/chat`) 进行单元测试，验证以下功能：

- **身份验证**：未登录用户应被拒绝
- **参数校验**：缺少必要参数时应返回错误
- **资源验证**：文档不存在时应返回 404
- **会话管理**：新会话创建、已有会话复用
- **流式响应**：SSE (Server-Sent Events) 格式的响应
- **错误处理**：LLM 调用异常时的错误传递

### 1.2 测试架构

```
┌─────────────────────────────────────────────────────────────┐
│                      测试文件结构                            │
├─────────────────────────────────────────────────────────────┤
│  1. 导入依赖 (Imports)                                      │
│  2. 模拟模块 (Mocks)                                        │
│  3. 辅助函数 (Helpers)                                      │
│  4. 测试用例 (Tests)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、逐部分详解

### 2.1 导入依赖

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { streamControllers } from '../../app/(apps)/luoye/ai/chat/state';
```

| 导入项              | 来源        | 用途                         |
| ------------------- | ----------- | ---------------------------- |
| `describe`          | vitest      | 定义测试套件（一组相关测试） |
| `it`                | vitest      | 定义单个测试用例             |
| `expect`            | vitest      | 断言函数，验证测试结果       |
| `vi`                | vitest      | Vitest 的模拟工具对象        |
| `beforeEach`        | vitest      | 每个测试用例执行前的钩子函数 |
| `NextRequest`       | next/server | Next.js 的请求对象类型       |
| `streamControllers` | 项目内部    | 流控制器状态管理             |

---

### 2.2 模拟模块 (Mocks)

模拟模块是单元测试的核心概念，用于**隔离被测试代码与外部依赖**。

#### 2.2.1 模拟服务器端 Fetch

```typescript
const mockServerFetch = vi.fn();
vi.mock('@/api/fetch/server', () => ({
    default: (...args: unknown[]) => mockServerFetch(...args),
}));
```

**解读**：

- `vi.fn()` 创建一个模拟函数（Spy），可以追踪调用情况
- `vi.mock()` 替换模块的默认导出
- 这样在测试中调用 `serverFetch()` 时，实际调用的是 `mockServerFetch`
- 可以通过 `mockServerFetch.mockResolvedValueOnce()` 控制返回值

#### 2.2.2 模拟 API 模块

```typescript
vi.mock('@/api', () => {
    const Rocket = {
        get: (url: string) => ({ url, method: 'GET' }),
        post: (url: string, data?: unknown) => ({ url, method: 'POST', data }),
        delete: (url: string) => ({ url, method: 'DELETE' }),
    };
    return {
        default: {
            user: { info: () => Rocket.get('/api/user') },
            luoye: {
                doc: (id: string) => Rocket.get(`/api/luoye/doc/${id}`),
            },
        },
    };
});
```

**解读**：

- 模拟 API 客户端，返回请求配置对象而非真实 HTTP 请求
- 这是一种**桩模块 (Stub)** 模式，提供简化的实现
- 避免测试时发起真实的网络请求

#### 2.2.3 模拟文件操作模块

```typescript
const mockChatFile = {
    cleanupSessions: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    appendMessage: vi.fn(),
    saveSession: vi.fn(),
    deleteSession: vi.fn(),
};
vi.mock('@/files', () => ({
    ChatFile: mockChatFile,
}));
```

**解读**：

- 模拟聊天文件的所有操作方法
- 每个方法都是 `vi.fn()` 创建的模拟函数
- 可以独立控制每个方法的行为和返回值

#### 2.2.4 模拟 LLM 模型

```typescript
const mockStream = vi.fn();
vi.mock('../../app/(apps)/luoye/ai/model', () => ({
    getMimoModel: () => ({
        stream: mockStream,
    }),
}));
```

**解读**：

- 模拟 LLM 模型的 `stream` 方法
- 避免测试时调用真实的 AI 模型

---

### 2.3 辅助函数 (Helpers)

#### 2.3.1 创建请求对象

```typescript
function makeRequest(body: Record<string, unknown>) {
    return new NextRequest('http://localhost:3000/luoye/ai/chat', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });
}
```

**用途**：快速创建符合 API 要求的请求对象

**使用示例**：

```typescript
makeRequest({ docId: 'doc-1', message: '你好' });
```

#### 2.3.2 读取 SSE 流

```typescript
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
```

**用途**：解析 SSE (Server-Sent Events) 格式的响应流

**SSE 格式说明**：

```
data: {"type": "session", "sessionId": "xxx"}
data: {"type": "message", "content": "你好"}
data: {"type": "done"}
```

#### 2.3.3 创建模拟会话

```typescript
function makeSession(
    overrides: Partial<import('@/files/luoye/chat').ChatSession> = {},
) {
    return {
        sessionId: 'session-1',
        docId: 'doc-1',
        userId: 'user-1',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...overrides,
    };
}
```

**用途**：创建默认会话对象，支持通过参数覆盖默认值

#### 2.3.4 创建模拟 LLM 流

```typescript
async function* fakeChunks(contents: string[]) {
    for (const content of contents) {
        yield { content };
    }
}
```

**用途**：模拟 LLM 的流式输出，生成异步迭代器

---

### 2.4 测试用例详解

#### 2.4.1 测试套件结构

```typescript
describe('POST /luoye/ai/chat (发送消息)', () => {
    let POST: typeof import('../../app/(apps)/luoye/ai/chat/route').POST;

    beforeEach(async () => {
        vi.clearAllMocks();
        streamControllers.clear();
        const mod = await import('../../app/(apps)/luoye/ai/chat/route');
        POST = mod.POST;
    });

    // 测试用例...
});
```

**关键点**：

- `describe` 定义测试套件，描述测试的功能模块
- `beforeEach` 在每个测试前执行，用于重置状态
- `vi.clearAllMocks()` 清除所有模拟函数的调用记录
- 动态导入确保 Mock 生效

#### 2.4.2 测试用例：未登录应返回 401

```typescript
it('未登录应返回 401', async () => {
    mockServerFetch.mockResolvedValueOnce(null); // user.info → null

    const res = await POST(makeRequest({ docId: 'doc-1', message: '你好' }));
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.message).toBe('未登录');
});
```

**测试流程**：

1. 设置模拟：`mockServerFetch` 返回 `null`（模拟未登录）
2. 执行请求：调用 `POST` 函数
3. 验证状态码：`expect(res.status).toBe(401)`
4. 验证响应体：检查错误消息

#### 2.4.3 测试用例：参数校验

```typescript
it('缺少 docId 应返回 400', async () => {
    mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });

    const res = await POST(makeRequest({ message: '你好' }));
    expect(res.status).toBe(400);
});
```

**测试流程**：

1. 模拟已登录状态
2. 发送缺少 `docId` 的请求
3. 验证返回 400 错误

#### 2.4.4 测试用例：SSE 流式响应

```typescript
it('新会话应返回 SSE 流，包含 session 事件', async () => {
    // 1. 设置用户和文档模拟
    mockServerFetch
        .mockResolvedValueOnce({ id: 'user-1' })
        .mockResolvedValueOnce({
            id: 'doc-1',
            name: '测试文档',
            content: '内容',
        });

    // 2. 设置会话模拟
    const session = makeSession();
    mockChatFile.cleanupSessions.mockResolvedValue(undefined);
    mockChatFile.createSession.mockResolvedValue(session);
    mockChatFile.getSession
        .mockResolvedValueOnce(session)
        .mockResolvedValueOnce({...session, messages: [...]});
    mockChatFile.appendMessage.mockResolvedValue(session);

    // 3. 设置 LLM 流模拟
    mockStream.mockResolvedValue(fakeChunks(['你', '好', '呀']));

    // 4. 执行请求
    const res = await POST(
        makeRequest({ docId: 'doc-1', message: '你好' }),
    );

    // 5. 验证响应
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    // 6. 解析 SSE 事件
    const events = await readSSEStream(res);
    const firstEvent = JSON.parse(events[0]);
    expect(firstEvent.type).toBe('session');
});
```

**测试流程**：

1. 链式设置多次模拟调用的返回值
2. 验证响应状态和 Content-Type
3. 解析 SSE 流并验证事件内容

#### 2.4.5 测试用例：错误处理

```typescript
it('LLM 异常应发送 error 事件', async () => {
    // ... 前置设置 ...

    // 模拟 LLM 抛出异常
    mockStream.mockResolvedValue(
        (async function* () {
            throw new Error('模型调用失败');
        })(),
    );

    const res = await POST(makeRequest({ docId: 'doc-1', message: '你好' }));
    const events = await readSSEStream(res);

    const errorEvents = events
        .map((e) => JSON.parse(e))
        .filter((e) => e.type === 'error');
    expect(errorEvents.length).toBe(1);
    expect(errorEvents[0].message).toBe('模型调用失败');
});
```

**测试流程**：

1. 创建一个立即抛出异常的异步生成器
2. 验证错误通过 SSE 事件传递给客户端

---

## 三、Vitest 核心概念速查

### 3.1 常用断言

| 断言方法             | 用途           | 示例                               |
| -------------------- | -------------- | ---------------------------------- |
| `toBe(value)`        | 严格相等 (===) | `expect(res.status).toBe(200)`     |
| `toEqual(object)`    | 深度相等       | `expect(obj).toEqual({ a: 1 })`    |
| `toBeTypeOf(type)`   | 类型检查       | `expect(id).toBeTypeOf('string')`  |
| `toContain(item)`    | 数组包含       | `expect(types).toContain('done')`  |
| `toHaveLength(n)`    | 数组长度       | `expect(events).toHaveLength(3)`   |
| `toBeGreaterThan(n)` | 大于           | `expect(count).toBeGreaterThan(0)` |

### 3.2 模拟函数方法

| 方法                                  | 用途               |
| ------------------------------------- | ------------------ |
| `vi.fn()`                             | 创建模拟函数       |
| `vi.mock(path, factory)`              | 模拟模块           |
| `vi.clearAllMocks()`                  | 清除所有调用记录   |
| `mockFn.mockResolvedValueOnce(value)` | 设置一次异步返回值 |
| `mockFn.mockResolvedValue(value)`     | 设置异步返回值     |
| `mockFn.mockReturnValue(value)`       | 设置同步返回值     |

### 3.3 测试钩子

| 钩子             | 执行时机           |
| ---------------- | ------------------ |
| `beforeEach(fn)` | 每个测试用例前     |
| `afterEach(fn)`  | 每个测试用例后     |
| `beforeAll(fn)`  | 所有测试前执行一次 |
| `afterAll(fn)`   | 所有测试后执行一次 |

---

## 四、测试设计模式总结

### 4.1 AAA 模式

每个测试用例遵循 **Arrange-Act-Assert** 模式：

```typescript
it('示例', async () => {
    // Arrange (准备)：设置模拟、创建测试数据
    mockServerFetch.mockResolvedValueOnce({ id: 'user-1' });

    // Act (执行)：调用被测试的函数
    const res = await POST(makeRequest({ docId: 'doc-1' }));

    // Assert (断言)：验证结果
    expect(res.status).toBe(200);
});
```

### 4.2 测试隔离原则

- 每个测试用例应该**独立运行**，不依赖其他测试
- 使用 `beforeEach` 重置状态
- 使用 Mock 隔离外部依赖

### 4.3 边界值测试

测试用例覆盖了多种边界情况：

- 未登录用户
- 缺少必要参数
- 资源不存在
- 外部服务异常

---

## 五、运行测试

```bash
# 运行所有测试
vitest

# 运行特定文件
vitest __tests__/routes/chat.test.ts

# 监听模式
vitest watch

# 生成覆盖率报告
vitest --coverage
```
