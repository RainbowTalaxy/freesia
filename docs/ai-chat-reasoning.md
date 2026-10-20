# 落页 AI 聊天：MiMo 推理内容（reasoning_content）技术文档

> 最后核对日期：2026-10-21（freesia 版本 1.0.1）。
> 涉及两个仓库：**freesia**（本仓，Next.js 14 聊天前端 + BFF 路由 + 本地 JSON 存储）与 **blog**（独立后端仓，Express + JSON 文件的权威存储，逻辑路径 `server/modules/luoye/chat-session.js`）。
> 聊天接口代码位于 `app/(apps)/luoye/ai/chat`。

## 1. 概述

落页 AI 聊天接入小米 MiMo（OpenAI 兼容）模型，并端到端支持其**推理内容**（`reasoning_content`）：

1. **推理过程可展示**：模型先输出推理、再输出正文，前端实时展示「正在思考」，可折叠查看。
2. **刷新后保留**：推理文本与正文、工具调用一起持久化，重新进入会话仍可展开查看。
3. **多轮回传**：携带工具调用的历史 assistant 消息，再次请求时把对应的 `reasoning_content` 回传给 MiMo，满足其多轮工具对话的协议要求；同时正确重建 `tool_calls` 与 `tool` 消息的配对关系。
4. **工具协议重建**：以 `tool_calls[].id` ↔ tool 消息的 `tool_call_id` 严格配对，恢复 LangChain / MiMo 需要的多轮工具调用链路。

### 背景：为什么升级 LangChain

旧版 `@langchain/openai@1.2.x` 在解析流式 chunk 时会丢弃 OpenAI 协议之外的非标准字段，因此拿不到 MiMo 的 `delta.reasoning_content`。本次精确升级并钉死以下版本，升级后推理文本可从 `chunk.additional_kwargs.reasoning_content` 读取：

| 依赖 | 版本 |
| --- | --- |
| `@langchain/openai` | `1.4.7` |
| `@langchain/core` | `1.1.49` |
| `langchain` | `1.3.5` |
| `@langchain/langgraph` | `1.2.9` |

模型配置在 `app/(apps)/luoye/ai/model.ts`：开发环境 `mimo-v2.6-flash`、生产 `mimo-v2.6-pro`，`baseURL` 为 MiMo 网关，并通过 `modelKwargs: { thinking: { type: 'enabled' } }` 打开推理。

## 2. 整体架构与数据流

```text
MiMo API（流式 delta.reasoning_content + delta.content + tool_calls）
        │
        ▼
MimoChatCompletions（ai/mimo-chat-model.ts）
   · 出站：给历史 assistant 消息补 reasoning_content，剥离内部 symbol 元数据
        │
        ▼
LangChain createAgent（ai/chat/agent.ts：search_docs / read_doc / save_doc_request / get_current_time）
        │  streamEvents('v2')
        ▼
ChatStreamTranslator（ai/chat/stream-translator.ts）   LangChain StreamEvent → SSE 事件
   · 累积 reasoning / content / tool_calls，做前缀校验与工具配对校验
        │  SSE（text/event-stream）
        ▼
浏览器 ChatStreamState（components/ChatPanel/stream-state.ts）
   · 按 messageId / run_id 累积成 part 列表（惰性创建）
        │
        ▼
ReasoningContent.tsx（思考胶囊/卡片） + AssistantContent.tsx（正文 + 工具）
        │
        ▼ 整流成功结束后双写（route.ts）
   ┌────────────────────────────┬───────────────────────────────────┐
   ▼                            ▼
freesia 本地 JSON            blog 后端 JSON（权威存储，读时规范化）
app/files/luoye/chat.ts      server/modules/luoye/chat-session.js
        │
        ▼ 下次对话
convertMessages()：重建 AIMessage(additional_kwargs.reasoning_content + tool_calls)
                  与 ToolMessage(tool_call_id)；不满足完整协议时降级为带来源文本
```

一次请求的生命周期由 `app/(apps)/luoye/ai/chat/route.ts` 的 `POST` 编排：鉴权 → 参数/附件校验 → 会话恢复或创建（含双写）→ 写入用户消息（双写）→ `convertMessages` 组装模型上下文 → 建立 `AbortController` 并注册到 `state.ts` → 运行 agent 流、经 translator 翻译成 SSE 推给前端 → 整流成功后 `throwIfAborted()` 再持久化 assistant 消息（双写）→ 发 `done`。

## 3. 模块说明

### 3.1 模型适配层

- `ai/model.ts`：`getMimoModel()` 工厂，返回经自定义 completions 包装的 `ChatOpenAI`。
- `ai/mimo-chat-model.ts`：`MimoChatCompletions extends ChatOpenAICompletions`，解决两件事：
  - **出站回传推理内容**：MiMo 多轮工具对话建议在「带 `tool_calls` 的 assistant 消息」上回传同轮 `reasoning_content`（API 目前并不强制，缺失也不会报错）。LangChain 把它放在 `additional_kwargs` 里，默认不会进入请求体。适配层用一个 **Symbol 元数据**（`collectReasoning`）按 assistant 消息顺序收集推理文本与工具 ID，在真正发请求的 `completionWithRetry` 里克隆 `request.messages`，有推理时才把 `reasoning_content` 加到对应 assistant 消息上。
  - **不污染 SDK 请求**：内部元数据通过 Symbol 挂在 options 上（含 `_generate` 的嵌套 `options.options`），在 `completionWithRetry` 中显式剥离后才调用父类，保证不会泄漏给 OpenAI SDK。
  - **一致性校验**：重建时按顺序比对请求体内 assistant 消息的工具 ID 与收集到的 `toolIds`，数量/顺序/ID 任一不匹配直接抛错（`MiMo 工具调用与推理消息不匹配` 等），避免错误地把 A 轮推理挂到 B 轮。

### 3.2 服务编排层

- `ai/chat/route.ts`：HTTP 编排、鉴权、附件白名单校验、会话生命周期、SSE 输出、中止处理；本身不含事件翻译与 DTO 转换细节。
- `ai/chat/session-service.ts`：后端 DTO ↔ 本地结构互转（`toBackendMessage` / `toLocalMessage` / `toLocalSession`）、`mergeLocalModelContent`（后端为权威源，本地仅在后端缺失时补 `reasoningContent` / `toolCalls` / 用户消息 `modelContent`）、后端追加消息。
- `ai/chat/stream-translator.ts`：`ChatStreamTranslator`，把 LangChain `StreamEvent` 累积翻译为 SSE 事件与可落盘的 assistant 消息（见第 4、8 节）。
- `ai/chat/state.ts`：模块级 `streamControllers: Map<sessionId, AbortController>`，用于并发 409 拦截与主动中止。
- `ai/chat/[sessionId]/abort/route.ts`：鉴权 + 会话归属校验后中止进行中的流，并负责中止后的状态恢复（被中止的部分 assistant 消息不双写）。

### 3.3 协议类型

`ai/chat/types.ts` 定义前端消费的 SSE 事件与内存消息类型；与后端存储类型（`app/api/types/luoye.ts`）相互独立，通过 `session-service.ts` 转换。

前端内存消息关键字段：

```ts
// 一段 assistant 文本（一轮模型输出）
interface AssistantChatMessage {
    id: string;
    role: 'assistant';
    content: string;            // 正文
    reasoningContent?: string;  // 推理内容
    isThinking?: boolean;       // 仅流式期使用：当前是否仍在输出推理
    createdAt: number;
}
```

### 3.4 前端展示层

- `components/ChatPanel/stream-state.ts`：`ChatStreamState` 流式状态机，消费 SSE 累积出有序 part 列表。
- `components/ChatPanel/ReasoningContent.tsx`：推理内容折叠组件。
- `components/ChatPanel/AssistantContent.tsx`：一条 assistant 消息内，按 part 顺序渲染推理块、正文（打字机）、工具状态（`ToolStatus` / `SaveDocRequest`）。
- `components/ChatPanel/ChatPanel.tsx`：请求发送、SSE 读取（RAF 快照刷新）、中止、手动展开状态 `reasoningExpanded: Record<id, boolean>`。
- `components/ChatPanel/utils.ts`：`convertSessionToMessages`，把后端历史会话转成渲染用 `Message[]`。

### 3.5 持久化与回放

- `app/files/luoye/chat.ts`：本地 JSON 读写（`temp/luoye/chat`），定义本地落盘结构（`ChatSessionAssistantChatMessage extends ChatAssistantFields`、`ChatSessionToolCallMessage`），以及出站模型上下文组装 `convertMessages` + 完整性判定 `hasCompleteToolProtocol`。
- blog `server/modules/luoye/chat-session.js`：权威存储，在**读取/写入时规范化**（normalize）part，保留新增的可选字段。

## 4. SSE 协议契约

所有事件以 SSE `data: <json>\n\n` 返回，`Content-Type: text/event-stream`。事件类型定义在 `ai/chat/types.ts` 的 `SseEventData`：

| 事件 | 字段 | 时机 |
| --- | --- | --- |
| `session` | `sessionId`, `messageId?` | 仅新会话首帧，回传会话 ID 与本轮 assistant 消息 ID |
| `reasoning` | `messageId`, `content` | 推理增量（可多帧） |
| `message` | `messageId`, `content` | 正文增量（可多帧） |
| `message_end` | `messageId` | 一轮模型输出（一个 model run）结束 |
| `tool_start` | `run_id`, `name`, `input` | 工具开始 |
| `tool_end` | `run_id`, `name`, `input`, `content` | 工具结束，`content` 为工具结果文本 |
| `done` | `messageId` | 整条 assistant 消息流成功结束 |
| `error` | `message` | 发生错误（中止不发该事件） |

典型带工具的事件顺序：

```text
reasoning* → message_end            （第 1 个 model run：决定调用工具）
tool_start → tool_end               （工具执行）
reasoning* → message* → message_end （第 2 个 model run：基于工具结果生成正文）
done
```

translator 关键规则：

- `on_chat_model_stream`：分别读取 `chunk.additional_kwargs.reasoning_content` 与 `chunk.content`，非字符串忽略，非空才推送增量。
- `on_chat_model_end`：用最终 `output` 补齐/校验流式累积；若 `output.tool_calls` 非空则记录工具调用。`reasoning_content` 是**可选**的——模型可能不经过推理直接调用工具，缺失时照常落盘工具调用、不阻断；但每个工具调用都必须有 `id`（用于与 tool 结果配对），缺失才抛错终止本轮（见第 8 节）。
- 空产出：model run 结束时若正文、推理、工具调用三者皆空，则**不落盘该 part、也不发 `message_end`**，避免孤儿空片段。
- tool part 在 `on_tool_start` 即进入落盘消息，`on_tool_end` 回填 `output` 与 `tool_call_id`。

## 5. 数据结构与持久化契约

### 5.1 后端 / 本地通用的 part 模型（`schemaVersion: 1`）

一条 assistant 消息由有序的 `text` 与 `tool_call` 两类 part 组成：

```ts
// text part（app/api/types/luoye.ts: ChatSessionTextPart）
{
  schemaVersion: 1,
  partId: string,
  type: 'text',
  content: string,
  reasoningContent?: string,                          // 本次新增（可选）
  toolCalls?: Array<{ id: string; name: string; args: Record<string, unknown> }>, // 本次新增（可选）
  createdAt: number,
}

// tool_call part（ChatSessionToolCallPart）
{
  schemaVersion: 1,
  partId: string,
  type: 'tool_call',
  toolName: string,
  runId: string,
  toolCallId?: string,   // 本次开始稳定回写：对应 MiMo/LangChain 的 tool_call_id
  input: Record<string, unknown>,
  output?: unknown,
  content?: string,
  status?: string,       // 仅 save_doc_request 使用
  createdAt: number,
  updatedAt: number,
}
```

**配对关系**：某个 `text` part 发起工具时写 `toolCalls[].id`，紧随其后的 `tool_call` part 用 `toolCallId` 引用同一个 ID。这是多轮工具对话能否正确重建的核心。

### 5.2 双写策略

- 请求中用户消息、结束后的 assistant 消息都先写 freesia 本地 JSON，再通过 `appendBackendMessage` 写 blog；写 blog 失败会让请求失败（本地不产生「用户已发、后端没有」的长期分叉）。
- 会话恢复以后端为权威源，`mergeLocalModelContent` 仅在后返回字段缺失时用本地数据补 `reasoningContent` / `toolCalls` / 用户 `modelContent`，用于缓解旧后端尚未保留新字段时的展示降级。

### 5.3 出站回放（`convertMessages`）

`app/files/luoye/chat.ts` 把历史消息转为 LangChain 消息：

- **完整协议**（`hasCompleteToolProtocol` 返回真）：严格按 `assistant(text+tool_calls)` → 若干 `tool` 的交替结构重建：
  - `AIMessage({ content, tool_calls, additional_kwargs: { reasoning_content } })`
  - `ToolMessage({ tool_call_id, name, content })`
  - 完整性要求：assistant 的工具集合与其后的 tool part 通过 `id` / `toolCallId` 一一对应、不交叉、无悬空。**与 `reasoningContent` 无关**：模型未产出推理时该字段缺省，仍按完整工具协议重建（此时 `AIMessage` 不带 `reasoning_content`）。
- **不完整协议（降级）**：仅当工具配对本身残缺（孤立 tool part、有调用无结果、ID 对不上等）时，折叠为**带来源标注的单条文本** `AIMessage`（`[历史工具调用：name]` / `[历史工具结果：name]`），既不丢上下文，也不会向 MiMo 发送非法工具序列。注意预置的 `read_doc` 注入虽无推理文本，但工具配对完整，仍走结构化重建。

## 6. 历史数据兼容与降级

**结论：本次是「只新增可选字段 + 读时兼容」，`schemaVersion` 仍为 1，无需数据迁移脚本，可直接上线。**

三条读路径对旧数据都安全：

1. **blog 读时规范化**（`normalizeTextPart` / `normalizeToolPart`）：`reasoningContent` 仅在为字符串时保留、`toolCalls` 仅在是数组且每项含合法 `id/name/args` 时保留；`toolCallId` 兼容 `part.tool_call_id`。旧数据缺字段即省略，不报错；下次该会话保存时自然升级为新结构（lazy migration）。
2. **freesia 模型回放**：旧 assistant part 没有 `toolCalls`，`hasCompleteToolProtocol` 判定为不完整 → 走文本降级，历史工具结果不丢失。是否降级只取决于工具 ID 配对是否完整、与有无推理无关，旧会话继续对话不会被新逻辑拒绝。
3. **前端渲染**：历史 text part 无 `reasoningContent` 时 `ReasoningContent` 返回 `null`；`isInitialReadDocMessage` 仍会隐藏会话开头预置的空 `read_doc` 消息（要求其 `reasoningContent === undefined`）。

## 7. 部署与发布

- **发布顺序：先发 blog，再发 freesia。**
  - 旧版 blog 的 normalize 在重建 part 对象时会丢弃未知的 `reasoningContent` / `toolCalls` / `toolCallId`。若 freesia 先上线，新产生的思考内容与工具配对在双写到后端时会被剥离：刷新后思考过程不显示、多轮工具续接降级为文本——但**不会报错、不会损坏数据**。
  - blog 先发是兼容的：它仅新增对可选字段的保留，旧版 freesia 不写这些字段，行为不变。
- 回滚安全：freesia 回滚后旧版本不读取新字段，历史新结构里的额外字段被忽略；两仓回滚都不影响旧数据读取。

## 8. 设计决策与已知边界

- **折叠 UI 不做开合动画**：`ReasoningContent` 折叠态是 `width: fit-content` 的小胶囊、展开态是全宽卡片。胶囊（`fit-content`、大圆角）与全宽卡片之间做过渡会因 `fit-content` 不可插值、圆角被非线性 clamp 产生畸形中间帧，多轮调整后确定**直接 `display: none/block` 瞬时切换**。流式期间「正在思考」的三点跳动是状态指示，予以保留，并在 `prefers-reduced-motion: reduce` 下关闭。
- **展开默认态**：流式中收到推理时 `isThinking=true` 默认展开；一旦正文开始（`isThinking=false`）自动折叠；历史消息默认折叠。用户手动开合由 `reasoningExpanded` 按 part id 记忆，优先级高于默认态。
- **推理内容滚动跟随**：展开且用户贴近底部时，新增推理自动滚到底部；用户上滑后停止跟随，避免强制抢滚动。
- **正文严格、推理宽容**：`complete()` 中最终 `output.content` 必须是流式累积的前缀，否则抛错避免落盘与展示不一致；而 `reasoning_content` 是非标字段，最终聚合形态可能随模型/框架版本变化，与其流式值不一致时**保留流式累积值**，不因此丢弃整轮回复。
- **空 model run 不落盘**：避免未配对/空产出在历史里留下空白片段；空轮不发 `message_end`，而前端 part 是惰性创建的（收到 chunk 才建），故对前端是等价 no-op。
- **reasoning 缺失不阻断工具调用**：`reasoning_content` 在入站翻译、出站回传、历史协议判定三处都视为**可选**。线上曾因「工具轮必须有 reasoning_content」的过严校验，在模型不思考直接调工具时整轮报错（`MiMo 工具调用缺少 reasoning_content`，搜索等工具不可用）；现已解耦——有推理则展示/落盘/回传，无推理时工具调用照常进行，严格校验只保留在真正影响工具配对的 `tool call id` 与正文一致性上。
- **已知低优先边界**：
  - 若 LangChain 对某次工具只发 `on_tool_start` 不发 `on_tool_end`，会留下 `toolCallId` 缺失的孤儿 tool part；因整流产出仅在成功结束后才落盘、且下轮 `hasCompleteToolProtocol` 会自动降级为文本，不影响正确性。
  - SSE 类型声明 `tool_end.content: string`，取值源于 LangChain `output?.content`，理论上可能是非字符串 content blocks；当前 MiMo 工具均返回字符串，属重构前即存在的类型宽松。

## 9. 本地开发与测试

- 本地 QA：freesia 前端 `http://localhost:3000/freesia/luoye/ai-chat`（`yarn dev`），接口指向本地 blog API（默认 `http://localhost:4000`）。
- 测试框架 Vitest，用法见 [how-to-use-unit-test.md](./how-to-use-unit-test.md)。

```bash
yarn test          # 全量
yarn test:watch    # 监听模式
```

本特性相关用例（`__tests__/routes/`、`__tests__/files/`）：

| 文件 | 覆盖点 |
| --- | --- |
| `mimo-chat-model.test.ts` | 出站注入 `reasoning_content`、Symbol 元数据剥离、工具 ID 对齐校验 |
| `chat-stream-translator.test.ts` | reasoning/message 增量、前缀校验、工具配对、空轮不落盘、推理分叉保流式 |
| `chat-stream-state.test.ts` | 前端状态机：惰性建 part、思考态、工具顺序、done/error |
| `chat-session-service.test.ts` | 后端/本地 DTO 互转、可选字段保留、`mergeLocalModelContent` |
| `chat-history.test.ts` | `convertMessages` 完整协议重建与旧数据文本降级 |
| `ChatFile.test.ts` | 本地读写与 part 落盘结构 |
| `chat.test.ts` / `chat-abort.test.ts` | 路由编排、双写、中止恢复 |
