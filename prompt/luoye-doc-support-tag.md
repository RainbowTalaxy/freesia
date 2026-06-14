# 落页文档支持设置标签 Tag

## 任务一

后端接口已增加了对 tag 的支持，请阅读 `docs/api-docs/luoye.md` 接口文档，并对接口层代码做对应调整。

## 任务二

请在文档的表单 DocForm 里增加对标签的表单项。表单项设计为：

- 字段名为「标签」
- 表单项主体为一个 Input 输入框，输入框右侧有一个添加按钮，输入框与添加按钮横向 flex 布局。
- 主体下方展示一个标签列表（与主体薯向左对齐），每个标签都带一个删除按钮，点击删除按钮可以删除对应标签。

## 任务三

请在 DocForm 里，在标签列表的最前面加一个「AI」按钮，点击后调用后端接口生成标签，并将生成的标签放在标签列表的开头，并用特殊的紫色边框标识出来。

接口等待的时候展示「生成中」，并加上这个 svg 图标：

```
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-loader-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9" /></svg>
```
