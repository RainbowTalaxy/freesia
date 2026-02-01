# 落页文档支持文档下载和复制

## 【已完成】任务一

请帮我写一个组件 `MenuButton` 。

```tsx
import { Button } from '@/components/form';
import { MenuButton, MenuItemData } from '@/components/MenuButton';

const items: MenuItemData[] = [
    { label: '复制此文档内容', onClick: () => {} },
    { label: '下载此文档', onClick: () => {} },
];

<MenuButton
    {...originalButtonProps} // 继承 Button 组件的所有属性
    items={items} // 菜单项列表，每项包含 label 和 onClick
    minWidth={100} // 设置一个最小值，如果没有最小值则按照实际内容
    maxWidth={200} // 设置一个最大值，如果没有最大值则按照实际内容
    position="bottom-left" // 菜单弹出位置，支持 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
>
    更多操作
</MenuButton>;
```

设计方式：

- 在 `app/components` 目录下创建 `MenuButton` 组件。
    - 在目录下建立 `MenuButton.tsx` 文件。
    - 样式文件命名用 `index.css` 。
    - 组件 className 使用 global 名称（非 module），命名用 `menu-btn` 和 `menu-btn-item` 。
- MenuButton 组件的本体为一个 Button 组件，`children` 作为按钮文本，当用户点击按钮时，在旁边弹出一个菜单列表。
- MenuButton 组件需要支持继承 Button 组件的所有属性，以便用户可以自定义按钮的样式和行为。
- 菜单项通过 `items: MenuItemData[]` 传入，每项包含 `label`（显示文本）和 `onClick`（点击回调）。
- 菜单项文本内容遭到宽度限制时，需要应用 CSS 的 ellipsis 样式，以防止内容溢出。
- 当失去焦点（比如点击其他地方）时，菜单列表需要自动关闭。当用户点击菜单项时，也需要关闭菜单列表。

请你帮我实现这个组件，并写个总结在下方用作后续的上下文，内容请精简概要。

### 总结

已在 `app/components/MenuButton/` 创建组件：

- **MenuButton.tsx**：继承 Button 属性，`children` 为按钮文本，`items` 为菜单项列表，支持 `minWidth`、`maxWidth`、`position`，点击外部自动关闭
- **index.css**：全局类名 `menu-btn`、`menu-btn-dropdown`、`menu-btn-item`

使用方式：

```tsx
import { MenuButton, MenuItemData } from '@/components/MenuButton';

const items: MenuItemData[] = [
    { label: '复制此文档内容', onClick: () => {} },
    { label: '下载此文档', onClick: () => {} },
];

<MenuButton items={items} minWidth={100} maxWidth={200} position="bottom-left">
    更多操作
</MenuButton>;
```

## 任务二

在 `app/(apps)/luoye/configs/index.ts` 中，写两个函数：

- `copyDocumentContent(doc: Doc, ...)`
- `downloadDocument(doc: Doc, ...)`

实现后请把 API 写在下方的总结中。

### 总结

已在 `app/(apps)/luoye/configs/index.ts` 添加两个函数：

```ts
// 复制文档内容到剪贴板，返回是否成功
copyDocumentContent(doc: Doc): Promise<boolean>

// 下载文档为文件（.md 或 .txt）
downloadDocument(doc: Doc): void
```
