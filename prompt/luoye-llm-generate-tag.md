# 落页支持通过 LLM 生成标签

> 我已经预先装好了 `@langchain/core` `langchain` `@langchain/openai` `@langchain/langgraph` 这些包。

模型调用可以通过：

```ts
import { ChatOpenAI } from '@langchain/openai';

export const getMimoModel = () =>
    new ChatOpenAI({
        model: 'mimo-v2-flash',
        temperature: 0,
        configuration: {
            baseURL: 'https://api.xiaomimimo.com/v1',
        },
    });
```

## 任务一

请你先写一个接口 POST `/luoye/ai/hello` ，然后在接口实现里调用模型，输入一个固定的 prompt "你好" ，将模型的回复作为接口的响应返回。

需要注意的是，这个接口必须检查用户是否登录。

> 完成任务后，请在下方写一个总结，内容精简概要，方便后续上下文使用。

### 总结

- 创建了 Next.js Route Handler `app/(apps)/luoye/ai/hello/route.ts`，路径为 `POST /luoye/ai/hello`
- 路由放在 `(apps)/luoye/` 下而非 `api/` 下，避免被 `next.config.mjs` 中 `/api/:path*` → 远程后端的 rewrite 规则拦截
- 鉴权方式：通过 `LOCAL_URL + /api/user` 转发 cookie 到远程后端校验登录状态，未登录返回 401
- 使用 `@langchain/openai` 的 `ChatOpenAI`，模型为 `mimo-v2-flash`，baseURL 为 `https://api.xiaomimimo.com/v1`
- API 定义已添加到 `app/api/luoye.ts` 的 `LuoyeAPI.aiHello`，使用 `BASE_PATH` 前缀（`/freesia/luoye/ai/hello`）
- 客户端调用：`clientFetch(API.luoye.ai.hello())`，服务端调用：`serverFetch(API.luoye.ai.hello())`
- `getMimoModel` 已提取为公共模块 `app/(apps)/luoye/ai/model.ts`

## 任务二

请你写一个接口 POST `/luoye/ai/doc/docId:/tags` ，根据文档 ID 生成该文档的标签列表。标签的数量控制在 1 到 5 个之间。

> 完成任务后，请在下方写一个总结，内容精简概要，方便后续上下文使用。

### 总结

- 创建了 Route Handler `app/(apps)/luoye/ai/doc/[docId]/tags/route.ts`，路径为 `POST /luoye/ai/doc/:docId/tags`
- 流程：鉴权 → 通过 `serverFetch` 获取文档 → 将标题和内容拼入 prompt → 调用 LLM → 解析 JSON 数组返回
- prompt 要求模型返回 1-5 个简洁标签的 JSON 数组
- API 定义：`LuoyeAPI.ai.docTags(docId)`，客户端调用 `clientFetch(API.luoye.ai.docTags('xxx'))`

## 任务三

请在 DocForm 里，在标签列表的最前面加一个「AI」按钮，点击后调用后端接口生成标签，并将生成的标签放在标签列表的开头，并用特殊的紫色边框标识出来。

接口等待的时候展示「生成中」，并加上这个 svg 图标：

```
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
```
