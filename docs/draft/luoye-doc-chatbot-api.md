# 落页 AI 聊天接口文档

## 数据类型

### ChatSession

```ts
interface ChatSession {
    sessionId: string; // 会话 ID
    docId: string; // 文档 ID
    userId: string; // 用户 ID
    messages: ChatMessage[]; // 消息列表
    createdAt: number; // 创建时间戳
    updatedAt: number; // 更新时间戳
}
```

### ChatMessage

```ts
interface ChatMessage {
    messageId: string; // 消息 ID
    role: 'user' | 'assistant'; // 角色
    content: string; // 消息内容
    createdAt: number; // 创建时间戳
}
```

### SSEEvent

```ts
type SSEEvent =
    | { type: 'session'; sessionId: string } // 会话创建
    | { type: 'message'; messageId: string; content: string } // 消息片段
    | { type: 'done'; messageId: string } // 消息完成
    | { type: 'error'; message: string }; // 错误
```

## 接口

### `POST` 发送消息（流式响应）

`/luoye/ai/chat`

发送用户消息，返回流式响应。如果是新会话，首条 SSE 事件返回 `sessionId`。

**参数**

```ts
interface Body {
    docId: string; // 文档 ID（必填）
    message: string; // 用户消息（必填）
    sessionId?: string; // 会话 ID（可选，不传则创建新会话）
}
```

**响应**

流式 SSE 响应，Content-Type: `text/event-stream`

```ts
type Response = SSEEvent;
```

**说明**

- 新会话时，首条事件返回 `sessionId`：`{"type":"session","sessionId":"abc123"}`
- 后续事件返回消息内容（流式）：`{"type":"message","messageId":"msg456","content":"你好"}`
- 最后返回完成事件：`{"type":"done","messageId":"msg456"}`
- 错误时返回：`{"type":"error","message":"文档不存在"}`
- 未登录返回 401 状态码
- 文档不存在返回 404 状态码

---

### `DELETE` 删除会话

`/luoye/ai/chat/:sessionId`

删除指定会话及其历史记录。

**响应**

```ts
interface Response {
    success: boolean;
}
```

**说明**

- 未登录返回 401 状态码
- 会话不存在返回 404 状态码
- 无权删除该会话返回 403 状态码

---

### `POST` 中断流式响应

`/luoye/ai/chat/:sessionId/abort`

中断正在进行的流式响应，恢复到上次完整的会话状态。

**响应**

```ts
interface Response {
    success: boolean;
}
```

**说明**

- 中断后，未完成的 assistant 消息会被删除
- 会话状态恢复到最后一条完整消息
- 未登录返回 401 状态码
- 会话不存在或无进行中的响应返回 404 状态码
- 无权操作该会话返回 403 状态码

---

## 会话管理

### 存储位置

```
temp/luoye/chat/{user_id}/{session_id}.json
```

### 清理策略

每次创建新会话时，服务端会检查并清理过期会话：

- 如果用户会话数量超过 10 个，删除最早的会话
- 如果会话上次更新时间超过 7 天，删除该会话
