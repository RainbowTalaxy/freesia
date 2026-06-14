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
    tags?: string[]; // 文档标签
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
    tags?: string[]; // 文档标签
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

export interface SearchResultItem {
    id: string; // 文档 ID
    name: string; // 文档标题
    updatedAt: number; // 更新时间
    matches: {
        field: 'name' | 'content'; // 匹配来源
        context: string; // 匹配上下文摘要
    }[];
}

export interface ChatImageAttachment {
    id: string;
    url: string;
    name: string;
    mimeType: string;
    size: number;
}

export interface ImageUploadResponse {
    message: string;
    file: {
        filename: string;
        originalname: string;
        mimetype: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
        size: number;
        path: string;
        url: string;
    };
}

export interface ChatSessionUserMessage {
    schemaVersion: 1;
    messageId: string;
    type: 'user_message';
    content: string;
    modelContent?: string;
    attachments?: ChatImageAttachment[];
    createdAt: number;
}

export interface ChatSessionTextPart {
    schemaVersion: 1;
    partId: string;
    type: 'text';
    content: string;
    createdAt: number;
}

export interface ChatSessionToolCallPart {
    schemaVersion: 1;
    partId: string;
    type: 'tool_call';
    toolName: string;
    runId: string;
    toolCallId?: string;
    input: Record<string, unknown>;
    output?: unknown;
    content?: string;
    status?: string;
    createdAt: number;
    updatedAt: number;
}

export type ChatSessionMessagePart =
    | ChatSessionTextPart
    | ChatSessionToolCallPart;

export interface ChatSessionAssistantMessage {
    schemaVersion: 1;
    messageId: string;
    type: 'assistant_message';
    parts: ChatSessionMessagePart[];
    createdAt: number;
}

export type ChatSessionMessage =
    | ChatSessionUserMessage
    | ChatSessionAssistantMessage;

export interface ChatSession {
    schemaVersion: 1;
    sessionId: string;
    userId: string;
    docId?: string;
    title: string;
    messages: ChatSessionMessage[];
    docUpdatedAt?: number;
    createdAt: number;
    updatedAt: number;
}

export interface ChatSessionSummary {
    schemaVersion: 1;
    sessionId: string;
    userId: string;
    docId?: string;
    title: string;
    messageCount: number;
    createdAt: number;
    updatedAt: number;
}
