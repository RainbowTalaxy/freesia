# 落页文档支持聊天机器人对话

> 这是一个非常兴奋的功能。

我期望在落页里增加一个对话机器人，有如下场景：

- 能够以当前文档作为上下文，与用户进行对话。
- 对话可以通过流式返回。
- 可以监听当前所选择的文本，添加到上下文中。
- 等待机器人回复时可以中断。

## 【已完成】任务一

请在文档页的 SideBar 的底部，增加一个悬浮的开关按钮，按钮文本为「与 AI 聊天」。这个开关有以下逻辑：

- 仅当用户登录时才能展示该按钮；
- 点击按钮后，SideBar 将与 Document 1:1 平分横向空间，并且需要隐藏 Document 中的目录。而在 SideBar 的等面积上方通过 fixed/absolute 布局展示一个聊天面板（面板先暂时展示一个空的），面板的右上方展示一个可以关闭聊天的按钮。

## 【已完成】任务二

开发 LLM 聊天接口（流式响应、会话管理、文件持久化、清理策略）。

## 【已完成】任务三

搭建 vitest 测试框架，编写后端接口测试用例。

## 【已完成】任务四

完成前端聊天面板 UI 代码。

## 【已完成】任务五

调整接口代码逻辑，并新增 search_docs 和 read_doc 工具。前端页面也有对应修改。

## 总结

已完成从后端 Agent 到前端 UI 的完整聊天功能：

**LLM Agent (`ai/chat/agent.ts`)**：

- 使用 LangChain `createAgent` 创建 ReAct Agent，模型为 `mimo-v2-flash`（温度 0.5）
- 绑定两个工具：
    - `search_docs` — 根据关键词搜索用户文档库（调用后端 search API）
    - `read_doc` — 根据文档 ID 读取完整内容

**聊天接口增强 (`ai/chat/route.ts`)**：

- 新会话创建时，通过 `createFakeReadDocMessage` 将当前文档内容伪造为 `read_doc` 工具调用结果注入对话历史，避免 LLM 重复调用
- System Prompt 引导 LLM 使用已有文档内容，仅在文档变更时重新读取
- 文档变更检测：比较 `session.docUpdatedAt` 与 `doc.updatedAt`，变更时追加 SystemMessage 提醒
- SSE 新增 `tool_start` / `tool_end` 事件类型，实时推送工具调用状态

**会话数据结构扩展 (`files/luoye/chat.ts`)**：

- 新增 `ChatSessionToolCallMessage` 类型（toolCallId, name, args, input, output, content）
- 新增 `docUpdatedAt` 字段追踪文档版本
- `convertMessages` 函数将嵌套消息结构展开为 LangChain 的 `HumanMessage` / `AIMessage`（含 tool_calls）/ `ToolMessage` 序列

**前端 ChatPanel 组件**：

- `ChatPanel.tsx` — SSE 流解析，管理 `pendingAssistantChatMessage` 和 `pendingToolCallMessages` Map，支持中断、自动滚动（MutationObserver）、IME 兼容
- `AssistantContent.tsx` — 渲染 AI 回复，区分文本片段（Typewriter）和工具调用（ToolStatus）
- `ToolStatus.tsx` — 根据工具名和状态显示友好提示（如「正在搜索 "xxx" ...」「已阅读《文档名》」）
- `Typewriter.tsx` — `requestAnimationFrame` 打字机动画，基础 40 字符/秒，带"追赶"加速效果
- `Welcome.tsx` — 欢迎页提示，`MessageLoading.tsx` — 三点跳动加载动画

**布局与样式**：

- 聊天模式下侧栏占 44% 宽度（`.chatMode` CSS 类）
- ChatPanel 通过 absolute 定位覆盖侧栏（保留 ProjectTitle 可见）
- 隐藏文档目录（`--toc-display: none`）

**测试覆盖 (`__tests__/`)**：

- `FileHandler.test.ts` — 文件操作工具类全方法覆盖
- `ChatFile.test.ts` — 会话 CRUD、消息追加、清理策略、`convertMessages` 转换
- `chat.test.ts` / `chat-delete.test.ts` / `chat-abort.test.ts` — 路由接口正常流程和异常流程（401/400/404/403/409）

## 【已完成】任务六

对 /chat 接口改造一下，允许不传入 docId ，用于更泛用的场景。

## 【已完成】任务七

在落页的欢迎页加一个「AI 聊天」的 Tab ，然后在这个 Tab 中展示 ChatPanel 组件。
