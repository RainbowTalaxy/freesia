# 落页 - 聊天支持发起文档保存请求

> /chat 接口代码地址：`app/(apps)/luoye/ai/chat`

我想实现一个功能：

1. 给 agent 加一个发起文档保存请求的 tool ；
2. 用户在页面上看到 tool 调用信息后，可以根据页面表单确认是否保存文档。

## 任务一

我们先完成接口部分的设计和实现：

1. 对 /chat 接口中的 agent 增加 `save_doc_request` tool ，tool 的输入输出参数均为：

    ```ts
    interface SaveDocRequestToolInput {
        title: string;
        content: string; // Markdown 格式
    }
    ```

    需要注意的是，这里的 tool 只是一个请求发起，这个请求会显示在前端页面上，用户可以通过页面上的表单来确认是否保存文档。

2. 当用户在页面上看到这个 tool 调用信息后，可以选择取消或者保存文档。这需要一个对应的接口来接收用户的选择，并且将选择结果添加到对话中，供 agent 后续决策使用。
3. 这个请求不需要阻塞正常的对话流程。

> 完成任务后，在下方写一个精简概要的总结，用作后续的上下文。

### 总结

**接口设计**：

1. **`save_doc_request` tool**（`app/(apps)/luoye/ai/chat/agent.ts`）：
    - 输入：`{ title: string, content: string }`（Markdown）
    - 行为：立即返回 `{ status: 'pending', title, content }`，不阻塞对话流程
    - 前端通过现有的 `tool_start` / `tool_end` SSE 事件感知此 tool 调用，`name` 为 `save_doc_request`，`run_id` 用于后续回写结果

2. **确认接口** `POST /luoye/ai/chat/[sessionId]/confirm-save`（`app/(apps)/luoye/ai/chat/[sessionId]/confirm-save/route.ts`）：
    - 请求体：`{ confirmed: boolean; runId: string }`
    - 行为：验证登录 + 会话归属后，根据 `runId` 定位对应的 tool call，将其 `content` 回写为 `'confirmed'` 或 `'cancelled'`，供 agent 后续决策感知
    - 返回：`{ success: true }`

3. **数据结构变更**（`app/files/luoye/chat.ts`）：
    - `ChatSessionToolCallMessage` 新增 `runId: string` 字段
    - 新增 `ChatFile.updateToolCallContent(userId, sessionId, runId, content)` 方法

## 任务二

在前端里先定义一下接口。

> 完成任务后，在下方写一个精简概要的总结，用作后续的上下文。

### 总结

**类型定义**（`app/(apps)/luoye/ai/chat/types.ts`）：

新增 `save_doc_request` 专属类型：

```ts
interface SaveDocRequestToolInput {
    title: string;
    content: string; // Markdown 格式
    [key: string]: unknown; // 兼容 ToolCallMessage.input: Record<string, unknown>
}

interface SaveDocRequestToolCallMessage extends ToolCallMessage {
    name: 'save_doc_request';
    input: SaveDocRequestToolInput;
    content?: 'pending' | 'confirmed' | 'cancelled';
}
```

**API 定义**（`app/api/luoye.ts`）：

在 `LuoyeAPI.ai.chat` 下新增 `confirmSave` 方法：

```ts
confirmSave: (
    sessionId: string,
    props: { confirmed: boolean; runId: string },
) =>
    Rocket.post<ActionResult>(
        `${BASE_PATH}/luoye/ai/chat/${sessionId}/confirm-save`,
        props,
    );
```

使用：`clientFetch(API.luoye.ai.chat.confirmSave(sessionId, { confirmed: true, runId }))`

## 任务三

> DocForm 代码地址：`app/(apps)/luoye/containers/DocForm.tsx`

现在实现一下前端 tool 调用的展示和用户交互：

在 Tool 结果渲染组件里，增加对 `save_doc_request` tool 调用的特殊处理。UI 样式如下：

- 为一个新起一行的 tool 组件。
- 左起文案为 “生成文档《xxx》”（"《xxx》"为一个可点击按钮），右侧为一个「接受」按钮和「放弃」按钮。
    - 接受后，文案更新为 “已保存文档《xxx》”，按钮不再展示；
    - 放弃后，文案更新为 “已放弃保存文档《xxx》”，按钮不再展示；
    - tool 内部状态完全由前端管理，不再受后续聊天流程影响。
    - 点击「接受」时，复用 DocForm 表单组件。
- 点击 "《xxx》" 时，弹出一个 Modal 卡片，展示文档标题及内容（Markdown 格式渲染）。卡片占据空间 65% 屏幕宽度，最大宽度 1200px ，高度自适应但不超过 90% 屏幕高度，内部滚动。在卡片顶部右上角悬浮展示「关闭」按钮。

> 完成任务后，在下方写一个精简概要的总结，用作后续的上下文。

### 总结

**新增/修改文件**：

1. **`SaveDocRequest.tsx`**（`app/(apps)/luoye/components/ChatPanel/SaveDocRequest.tsx`）：新组件，处理 `save_doc_request` tool 的展示和交互：
    - 本地状态 `status: 'pending' | 'confirmed' | 'cancelled'`，独立于聊天流程
    - 左侧文案 + "《title》"点击按钮（预览），右侧「接受」/「放弃」按钮（pending 时）
    - 点击「接受」→ 弹出 `DocForm`（预填标题）→ 创建文档后调 `updateDoc` 写入内容 → 调 `confirmSave` 通知后端
    - 点击「放弃」→ 调 `confirmSave(confirmed: false)` → 更新状态
    - 点击《title》→ Portal Modal，展示标题 + Markdown 渲染内容，65vw / max 1200px / max-h 90vh，右上角悬浮关闭按钮

2. **`DocForm.tsx`**：新增 `initialName?: string` prop，在新建模式下预填标题

3. **`ToolStatus.tsx`**：新增 `sessionId: string | null` prop；`save_doc_request` 渲染 `<SaveDocRequest>` 而非文字

4. **`AssistantContent.tsx`**：新增 `sessionId: string | null` prop，透传给 `ToolStatus`

5. **`ChatPanel.tsx`**：两处 `<AssistantContent>` 加上 `sessionId={sessionId}`

6. **`ChatPanel.module.css`**：新增 `saveDocRequest`、`saveDocLabel`、`saveDocTitle`、`saveDocAccept`、`saveDocReject`、`previewOverlay`、`previewCard`、`previewClose`、`previewTitle` 样式
