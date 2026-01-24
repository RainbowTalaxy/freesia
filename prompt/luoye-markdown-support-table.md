# 落页 markdown 预览支持表格

## 任务一

对落页里的 markdown 组件增加对 gfm 的支持，其中会包含表格的支持。

完成任务后请将总结些在下方，内容尽量精简概要。

### 总结

- 安装 `remark-gfm@4.0.1` 插件
- 在 [Markdown/index.tsx](../app/(apps)/luoye/components/Markdown/index.tsx) 中引入并添加到 `remarkPlugins`
- 在 [index.module.css](../app/(apps)/luoye/components/Markdown/index.module.css) 中添加表格样式（`table`, `th`, `td`）
