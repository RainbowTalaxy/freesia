export enum Scope {
    Private = 'private',
    Public = 'public',
}

export enum DocType {
    Text = 'text',
    Markdown = 'markdown',
}

export interface DocDir {
    docId: string; // 文档 id
    name: string; // 文档名称
    scope: Scope; // 可见范围
    updatedAt: number; // 更新时间
}

export interface WorkspaceItem {
    id: string; // 工作区 id
    name: string; // 工作区名称
    description: string; // 工作区描述
    scope: Scope; // 可见范围
    joinAt: number; // 添加时间
}

export interface Workspace {
    id: string; // 工作区 id
    name: string; // 工作区名称
    description: string; // 工作区描述
    scope: Scope; // 可见范围
    creator: string; // 创建者
    admins: string[]; // 管理员列表
    members: string[]; // 成员列表
    docs: DocDir[]; // 文档列表
    createdAt: number; // 创建时间
    updatedAt: number; // 更新时间
}

export interface DocItem {
    id: string; // 文档 id
    name: string; // 文档名称
    creator: string; // 创建者
    scope: Scope; // 可见范围
    docType: DocType; // 文档类型
    createdAt: number; // 创建时间
    updatedAt: number; // 更新时间
}

export interface Doc {
    id: string; // 文档 id
    name: string; // 文档名称
    creator: string; // 创建者
    admins: string[]; // 管理员列表
    members: string[]; // 成员列表
    scope: Scope; // 可见范围
    date: number; // 所属日期
    workspaces: string[]; // 所属工作区 id
    docType: DocType; // 文档类型
    content: string; // 文档内容
    createdAt: number; // 创建时间
    updatedAt: number; // 更新时间
    deletedAt: number | null; // 删除时间
}

export interface DocBinItem {
    docId: string; // 文档 id
    name: string; // 文档名称
    executor: string; // 执行者
    deletedAt: number; // 删除时间
}
