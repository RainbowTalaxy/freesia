# 落页文档支持聊天机器人对话

> 这是一个非常兴奋的功能。

我期望在落页里增加一个对话机器人，有如下场景：

- 能够以当前文档作为上下文，与用户进行对话。
- 对话可以通过流式返回。
- 可以监听当前所选择的文本，添加到上下文中。
- 等待机器人回复时可以中断。

## 任务一

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

## 任务二

现在我需要开发一个流式接口，用于聊天机器人对话。但是由于现在没有任何数据库（或者你也可以暂时用本地的文件系统），所以不知道如何进行前后端交互。

同时这个接口还需要兼顾安全，比如预防 CSRF 攻击。你有什么好的方案吗？
