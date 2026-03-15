# 落页支持搜索

## 任务一

根据 [接口文档](docs/api-docs/luoye.md) ，实现一下搜索接口的定义。

> 完成任务后，在下面下一个精简概要的总结，用作后续的上下文。

### 总结

在 `app/api/types/luoye.ts` 中新增了 `SearchResultItem` 类型（包含 `id`、`name`、`updatedAt`、`matches` 字段）。在 `app/api/luoye.ts` 中新增了 `search` 方法，使用 `Rocket.get` 调用 `GET /search` 接口，接受 `{ keyword, workspaceId?, limit? }` 查询参数，返回 `SearchResultItem[]`。
