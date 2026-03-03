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

### 总结

已实现文档页聊天入口功能：

**新增组件：**

- `components/ChatButton` - 悬浮在 SideBar 底部的「与 AI 聊天」按钮，仅登录用户可见
- `components/ChatPanel` - 聊天面板（空占位），右上角有关闭按钮

**状态管理：**

- `DocContext` 新增 `isChatVisible` / `setChatVisible` 控制聊天面板显隐
- `PageLayout` 新增 `enableChatMode()` / `disableChatMode()` 函数通过 DOM 操作切换布局

**布局变化（聊天模式开启时）：**

- SideBar 与 Document 各占 50% 宽度（`layout.module.css` 的 `.chatMode` 类）
- ChatPanel 通过 absolute 定位覆盖在 SideBar 上方（top 为 `--doc-nav-bar`，可见 ProjectTitle）
- 隐藏文档目录（通过 CSS 变量 `--toc-display: none`）

**CSS 变量提升：**

- `--doc-nav-bar: 72px` 从 `.docView` 提升至 `.container` 层级

## 【已完成】任务二

名词解释：

- 会话：指 LLM 与用户的一次对话上下文（并非仅指一问一答）。

现在需要开发一套 LLM 聊天接口。有如下要求：

1. 用户在面板输入消息后，会发起一个接口请求，并返回流式响应，页面会实时展示 LLM 回复。
    - 请求参数会携带 `doc_id` 、`message` 信息。
    - 响应中需要返回新创建的 `session_id` ，用于后续跟踪会话。
2. 用户可以删除当前会话，服务端需要根据 `session_id` 清除对应的会话状态。
3. 用户可以中断正在返回的流式响应，服务端需要根据 `session_id` 中断对应的 LLM 调用，并恢复上次会话状态。
4. 每个消息都要有 `message_id` 。
5. 服务端需要在文件系统中记录每个会话内容。
    - 在项目根目录下创建 `temp/luoye/chat/` 目录。
    - 每个会话内容都存储在 `temp/luoye/chat/{user_id}/{session_id}.json` 文件中。
6. 每当创建新会话时，服务端需要检查历史数据体积，采取以下清理策略：
    - 如果用户会话数量超过 10 个，服务端需要删除最早的会话。
    - 如果会话上次更新时间超过 7 天，服务端需要删除该会话。

实现要求：

1. 建立一个文件层代码 `app/files/` 目录中放一个操作文件的工具类，以及一个与落页相关的封装层工具类。（可以参照接口层 `app/api/` 的文件结构）
2. 接口写在 `app/(apps)/luoye/ai/` 下。
3. 接口需要检查用户登录。

> 完成任务后，在下方写一段精简概要的总结，作为后续任务的上下文。

### 总结

已实现 LLM 聊天接口的完整后端能力：

**文件操作层 (`app/files/`)**：

- `FileHandler.ts` — 通用文件操作工具类（JSON 读写、目录创建、文件删除等）
- `luoye/chat.ts` — 聊天会话封装层，定义了 `ChatSession` / `ChatMessage` 数据结构，提供创建/读取/保存/追加消息/删除会话/清理过期会话方法
- `index.ts` — 统一导出 `FileHandler` 和 `ChatFile`

**聊天接口 (`app/(apps)/luoye/ai/chat/`)**：

- `POST /luoye/ai/chat` — 发送消息，返回 SSE 流式响应（事件类型：`session` / `message` / `done` / `error`）
- `DELETE /luoye/ai/chat/:sessionId` — 删除会话
- `POST /luoye/ai/chat/:sessionId/abort` — 中断流式响应，恢复会话状态
- `state.ts` — 全局 `Map<sessionId, AbortController>` 管理进行中的流式响应

**API 定义层 (`app/api/luoye.ts`)**：

- 新增 `ai.chat.send()` / `ai.chat.deleteSession()` / `ai.chat.abort()` 三个 Rocket API 定义

**关键设计**：

- 会话存储路径：`temp/luoye/chat/{userId}/{sessionId}.json`
- 清理策略：每次新建会话时自动删除超过 10 个或超过 7 天的历史会话
- 中断机制：通过 `AbortController` 中止 LLM 流式调用，中断后删除未完成的 assistant 消息
- 所有接口均通过 `serverFetch(API.user.info())` 检查登录状态

## 【已完成】任务三

请你为这个项目搭建 vitest 测试框架，并且为你在任务二中编写的后端接口编写测试用例，要求覆盖正常流程和异常流程。

## 【已完成】任务四

请你完成前端的 UI 代码。
