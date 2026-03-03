# 任务二：LLM 聊天接口调研报告

## 一、现有项目结构

### 1. API 层 (`app/api/`)

| 文件              | 用途                                                      |
| ----------------- | --------------------------------------------------------- |
| `index.ts`        | 统一导出 `API.user` 和 `API.luoye`                        |
| `user.ts`         | 用户登录/登出/信息接口                                    |
| `luoye.ts`        | 落页文档/工作区接口，包含 `ai.hello()` 和 `ai.doc.tags()` |
| `server.ts`       | `serverFetch` 和 `Server.userId()` 工具函数               |
| `fetch/server.ts` | 服务端请求封装，支持 render cache                         |

### 2. AI 接口层 (`app/(apps)/luoye/ai/`)

| 文件                        | 用途                                                   |
| --------------------------- | ------------------------------------------------------ |
| `model.ts`                  | LLM 模型配置，使用 `@langchain/openai` 的 `ChatOpenAI` |
| `hello/route.ts`            | 简单 AI 接口示例                                       |
| `doc/[docId]/tags/route.ts` | 文档标签生成接口                                       |

### 3. 用户登录检查模式

现有 AI 接口的登录检查方式：

```typescript
const user = await serverFetch(API.user.info(), true);
if (!user) {
    return NextResponse.json({ message: '未登录' }, { status: 401 });
}
```

### 4. 数据存储方式

项目使用 JSON 文件存储数据：

- `workspaces/` - 工作区
- `docs/` - 文档
- `users/{id}/` - 用户数据

---

## 二、任务二需要新增的内容

### 1. 文件操作层 (`app/files/`) - 需新建

```
app/files/
├── index.ts          # 统一导出
├── FileHandler.ts    # 通用文件操作工具类
└── luoye/
    └── chat.ts       # 聊天会话文件操作封装
```

**FileHandler.ts 需要实现的功能：**

- 读写 JSON 文件
- 创建目录（递归）
- 列出目录文件
- 删除文件/目录
- 获取文件状态（更新时间）

**luoye/chat.ts 需要实现的功能：**

- 创建会话文件
- 追加消息到会话
- 读取会话
- 删除会话
- 清理过期会话（数量 > 10 或 时间 > 7 天）

### 2. 聊天接口 (`app/(apps)/luoye/ai/chat/`) - 需新建

```
app/(apps)/luoye/ai/chat/
├── route.ts              # POST: 发送消息（流式响应）
├── [sessionId]/
│   └── route.ts          # DELETE: 删除会话
└── [sessionId]/abort/
    └── route.ts          # POST: 中断流式响应
```

### 3. 会话数据结构设计

```typescript
interface ChatSession {
    sessionId: string;
    docId: string;
    userId: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
}

interface ChatMessage {
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
}
```

存储路径：`temp/luoye/chat/{user_id}/{session_id}.json`

---

## 三、技术要点

### 1. 流式响应实现

项目尚未实现流式响应，需要使用 Next.js App Router 的 `ReadableStream`：

```typescript
const encoder = new TextEncoder();
const stream = new ReadableStream({
    async start(controller) {
        // 使用 LangChain 的 stream() 方法
        for await (const chunk of await model.stream(prompt)) {
            controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
            );
        }
        controller.close();
    },
});

return new Response(stream, {
    headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    },
});
```

### 2. SSE 数据格式设计

首条消息返回 `sessionId`，后续返回消息内容：

```
data: {"type":"session","sessionId":"xxx"}

data: {"type":"message","messageId":"xxx","content":"你好"}

data: {"type":"message","messageId":"xxx","content":"，我"}

data: {"type":"done","messageId":"xxx"}
```

### 3. 中断机制

需要实现：

- 服务端维护 `Map<sessionId, AbortController>` 全局状态
- 发送消息时创建 `AbortController` 并存入 Map
- 中断接口调用对应 `AbortController.abort()`
- 中断后恢复上次会话状态（删除最后一条未完成的 assistant 消息）

### 4. 清理策略实现

```typescript
async function cleanupOldSessions(userId: string) {
    const dir = `temp/luoye/chat/${userId}`;
    const files = await fs.readdir(dir);

    // 按更新时间排序
    const sessions = await Promise.all(
        files.map(async (file) => {
            const stat = await fs.stat(`${dir}/${file}`);
            return { file, updatedAt: stat.mtimeMs };
        }),
    );
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < sessions.length; i++) {
        const { file, updatedAt } = sessions[i];

        // 超过 10 个，删除最早的
        if (i >= 10) {
            await fs.unlink(`${dir}/${file}`);
            continue;
        }

        // 超过 7 天，删除
        if (now - updatedAt > SEVEN_DAYS) {
            await fs.unlink(`${dir}/${file}`);
        }
    }
}
```

---

## 四、依赖情况

项目已安装的 LLM 相关依赖：

| 依赖                   | 版本    | 用途             |
| ---------------------- | ------- | ---------------- |
| `@langchain/core`      | ^1.1.19 | LangChain 核心   |
| `@langchain/openai`    | ^1.2.5  | OpenAI 兼容接口  |
| `@langchain/langgraph` | ^1.1.3  | 状态图（可选）   |
| `langchain`            | ^1.2.18 | LangChain 完整包 |

这些依赖足以支持流式响应和会话管理。

---

## 五、接口设计

### 1. 发送消息

**POST** `/luoye/ai/chat`

**请求参数：**

```typescript
interface ChatRequest {
    docId: string; // 文档 ID
    message: string; // 用户消息
    sessionId?: string; // 可选，已有会话 ID
}
```

**响应：** 流式 SSE

```
data: {"type":"session","sessionId":"new-session-id"}

data: {"type":"message","messageId":"msg-id","content":"部分内容"}

data: {"type":"done","messageId":"msg-id"}
```

### 2. 删除会话

**DELETE** `/luoye/ai/chat/[sessionId]`

**响应：**

```typescript
interface DeleteResponse {
    success: boolean;
}
```

### 3. 中断响应

**POST** `/luoye/ai/chat/[sessionId]/abort`

**响应：**

```typescript
interface AbortResponse {
    success: boolean;
}
```

---

## 六、实现步骤

1. **创建文件操作层** (`app/files/`)
    - 实现通用文件工具类
    - 实现聊天会话文件操作封装

2. **创建聊天接口** (`app/(apps)/luoye/ai/chat/`)
    - 实现发送消息接口（流式响应）
    - 实现删除会话接口
    - 实现中断响应接口

3. **更新 API 层** (`app/api/luoye.ts`)
    - 添加聊天相关 API 方法

4. **测试验证**
    - 测试流式响应
    - 测试中断机制
    - 测试清理策略
