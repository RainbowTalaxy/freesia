# 落页

「落页」是一个在线文档工具，支持 Markdown 语法，多人协作。

它由以下实体组成：

- 工作区 `workspace`
- 文档 `doc`

## 数据设计

### 文件结构

该项目数据使用 json 文件进行存储。在根目录下，有以下目录：

- `workspaces` 工作区目录
    - `{id}.json` 工作区信息 `Workspace`
- `docs` 文档目录
    - `{id}.json` 文档信息 `Doc`
- `users` 用户目录
    - `{id}` 用户目录
        - `workspaces.json` 工作区列表 `WorkspaceItem[]`
        - `docs.json` 文档列表 `DocItem[]`
        - `recent-docs.json` 最近文档列表 `DocItem[]`
        - `doc-bin` 文档回收站
        - `tags.json` 用户标签列表 `string[]`

### 权限管理

- 工作区
    - 管理员：读、更新、创建文档
    - 成员：读、创建文档
    - 访客：读
- 文档
    - 管理员：读、更新、删除
    - 成员：读、更新
    - 访客：读

## 数据类型

### Workspace

```ts
interface Workspace {
    id: string; // 工作区 id
    name: string; // 工作区名称
    description: string; // 工作区描述
    scope: 'private' | 'public'; // 可见范围
    creator: string; // 创建者
    admins: string[]; // 管理员列表
    members: string[]; // 成员列表
    docs: DocDir[]; // 文档列表
    createdAt: number; // 创建时间
    updatedAt: number; // 更新时间
}
```

### WorkspaceItem

```ts
interface WorkspaceItem {
    id: string; // 工作区 id
    name: string; // 工作区名称
    description: string; // 工作区描述
    scope: 'private' | 'public'; // 可见范围
    joinAt: number; // 添加时间
}
```

### Doc

```ts
interface Doc {
    id: string; // 文档 id
    name: string; // 文档名称
    creator: string; // 创建者
    admins: string[]; // 管理员列表
    members: string[]; // 成员列表
    scope: 'private' | 'public'; // 可见范围
    date: number; // 所属日期
    workspaces: string[]; // 所属工作区 id
    docType: 'text' | 'markdown'; // 文档类型
    content: string; // 文档内容
    tags?: string[]; // 文档标签
    createdAt: number; // 创建时间
    updatedAt: number; // 更新时间
    deletedAt: number | null; // 删除时间
}
```

### DocItem

```ts
interface DocItem {
    id: string; // 文档 id
    name: string; // 文档名称
    creator: string; // 创建者
    scope: 'private' | 'public'; // 可见范围
    docType: 'text' | 'markdown'; // 文档类型
    tags?: string[]; // 文档标签
    date: number; // 所属日期
    createdAt: number; // 创建时间
    updatedAt: number; // 更新时间
}
```

### DocDir

```ts
interface DocDir {
    docId: string; // 文档 id
    name: string; // 文档名称
    scope: 'private' | 'public'; // 可见范围
    createdAt: number; // 创建时间
    date: number; // 所属日期
    updatedAt: number; // 更新时间
}
```

### DocBinItem

```ts
interface DocBinItem {
    docId: string; // 文档 id
    name: string; // 文档名称
    executor: string; // 执行者
    deletedAt: number; // 删除时间
}
```

## 接口

### `GET` 获取工作区列表

`/workspaces`

**响应**

```ts
type Response = WorkspaceItem[];
```

### `PUT` 更新工作区列表

`/workspaces`

**参数**

```ts
interface Body {
    workspaceIds: WorkspaceItem[];
}
```

**响应**

```ts
type Response = WorkspaceItem[];
```

### `GET` 获取工作区信息

`/workspace/:id`

**响应**

```ts
type Response = Workspace;
```

### `POST` 创建工作区

`/workspace/:id`

**参数**

```ts
interface Body {
    name: string;
    description?: string;
    scope?: 'private' | 'public'; // 默认 `private`
}
```

**响应**

```ts
type Response = Workspace;
```

### `PUT` 更新工作区信息

`/workspace/:id`

**参数**

```ts
interface Body {
    name?: string;
    description?: string;
    scope?: 'private' | 'public';
    docs?: DocDir[];
}
```

**响应**

```ts
type Response = Workspace;
```

### `DELETE` 删除工作区

`/workspace/:id`

**响应**

```ts
interface Response = {
    success: boolean;
};
```

### `GET` 获取最近文档

`/recent-docs`

返回最近的 20 条文档记录。

**响应**

```ts
type Response = DocItem[];
```

### `DELETE` 删除最近文档

`/recent-docs/:docId`

```ts
interface Response = {
    success: boolean;
};
```

### `GET` 获取用户标签列表

`/tags`

**响应**

```ts
type Response = string[];
```

### `GET` 获取文档列表

`/docs`

**响应**

```ts
type Response = DocItem[];
```

### `GET` 获取文档信息

`/doc/:id`

**响应**

```ts
type Response = Doc;
```

### `POST` 创建文档

`/doc`

**参数**

```ts
interface Body {
    workspaceId: string;
    name?: string;
    scope?: 'private' | 'public';
    date?: number;
    docType?: 'text' | 'markdown';
    tags?: string[]; // 文档标签
}
```

**响应**

```ts
type Response = Doc;
```

**说明**

- `tags` 参数用于设置文档的标签
- 必须是字符串数组，每个标签不能为空字符串
- 创建文档时设置的标签会自动添加到用户的标签列表中

### `PUT` 更新文档信息

`/doc/:id`

**参数**

```ts
interface Body {
    name?: string;
    content?: string;
    scope?: 'private' | 'public';
    date?: number;
    workspaces?: string[]; // 文档所属的工作区 ID（数组格式，目前仅支持单个）
    tags?: string[]; // 文档标签
}
```

**响应**

```ts
type Response = Doc;
```

**说明**

- `workspaces` 参数用于修改文档所属的工作区
- 必须是包含单个工作区 ID 的数组
- 指定的工作区必须存在，且当前用户对该工作区有 Member 及以上权限
- 修改后会自动同步更新相关工作区的文档列表
- `tags` 参数用于修改文档的标签
- 必须是字符串数组，每个标签不能为空字符串
- 更新文档时设置的标签会自动添加到用户的标签列表中

### `DELETE` 删除文档

`/doc/:id`

**响应**

```ts
interface Response = {
    success: boolean;
};
```

### `GET` 获取文档回收站

`/doc-bin`

**响应**

```ts
type Response = DocBinItem[];
```

### `PUT` 恢复文档

`/doc/:docId/restore`

**响应**

```ts
interface Response = {
    success: boolean;
};
```

### `GET` 搜索文档

`/search`

**参数**

```ts
interface Query {
    keyword?: string; // 搜索关键词（大小写敏感，多词 AND 搜索，用空白分隔）
    workspaceId?: string; // 限定搜索的工作区 ID
    limit?: number; // 返回明细数量上限，默认 30，最大 30
    timeField?: 'updatedAt' | 'createdAt' | 'date'; // 时间筛选字段，默认 updatedAt
    startDate?: string; // 开始日期，格式 YYYY-MM-DD，包含当天 00:00:00.000
    endDate?: string; // 结束日期，格式 YYYY-MM-DD，包含当天 23:59:59.999
}
```

**响应**

```ts
interface SearchResultItem {
    id: string; // 文档 ID
    name: string; // 文档标题
    updatedAt: number; // 更新时间
    matches: {
        field: 'name' | 'content'; // 匹配来源
        context: string; // 匹配上下文摘要
    }[];
}

interface Response {
    total: number; // 搜索结果总数
    items: SearchResultItem[]; // 搜索结果明细，最多 30 条
}
```

**说明**

- `workspaceId` 是第一层筛选条件；如果指定 `workspaceId`，则仅在该工作区的文档中搜索，需要 Member 及以上权限
- 时间范围是第二层筛选条件，支持按 `updatedAt`、`createdAt` 或 `date` 筛选；不传 `timeField` 时默认按 `updatedAt` 筛选
- `keyword` 是末位筛选条件；如果为空，则返回工作区和时间范围内的全部文档，且每条记录的 `matches` 为空数组
- 搜索关键词支持多词 AND 搜索，使用空白分隔多个词。例如搜索 "hello world" 仅返回同时包含 "hello" 和 "world" 的文档
- 搜索关键词为大小写敏感的精确子串匹配，不支持模糊搜索
- 搜索范围为当前用户有权限访问的文档的标题和正文
- `startDate` 和 `endDate` 只支持 `YYYY-MM-DD`，可只传一端；若两端都传，`startDate` 不能晚于 `endDate`
- 同一文档的多个匹配项归入同一条记录，不单独计入明细数量上限
- 接口最多返回 30 条搜索结果明细，同时通过 `total` 返回完整命中数量
- 结果按文档更新时间降序排序
- 已删除的文档不会出现在搜索结果中
