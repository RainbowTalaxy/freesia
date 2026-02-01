import { Doc, DocType, Workspace, WorkspaceItem } from '@/api/luoye';
import dayjs from 'dayjs';

export const PROJECT_ICON = '🍂';
export const PROJECT_NAME = '落页';

export const DEFAULT_WORKSPACE_PLACEHOLDER = {
    name: '个人工作区',
    description: '用于存放个人文档的工作区',
};

export const LEAVE_EDITING_TEXT = '确定离开当前正在编辑的文档？';

export const DOCTYPE_OPTIONS = Object.values(DocType);

export const DOCTYPE_OPTIONS_NAME = {
    [DocType.Text]: '文本',
    [DocType.Markdown]: 'Markdown',
};

export const generateDocPageTitle = (doc: Doc | null) =>
    `${doc ? doc.name || '未命名' : '文档不存在'} | ${PROJECT_NAME}`;

export const splitWorkspace = (
    allWorkspaces: WorkspaceItem[],
    userId: string,
) => {
    const _allWorkspaces = allWorkspaces.slice();
    const userWorkspaceIdx = _allWorkspaces.findIndex(
        (workspace) => workspace.id === userId,
    );
    let userWorkspace = _allWorkspaces[userWorkspaceIdx]!;
    if (userWorkspaceIdx !== -1) {
        _allWorkspaces.splice(userWorkspaceIdx, 1);
    }
    userWorkspace = {
        ...userWorkspace,
        ...DEFAULT_WORKSPACE_PLACEHOLDER,
    };
    return Object.freeze({
        userWorkspace,
        workspaces: _allWorkspaces,
    });
};

export const workSpaceName = (
    workspace: Workspace | WorkspaceItem,
    userId: string | null,
) => {
    return workspace.id === userId
        ? DEFAULT_WORKSPACE_PLACEHOLDER.name
        : workspace.name;
};

export const date = (time: number) => dayjs(time).format('YYYY-MM-DD HH:mm');

export const checkAuth = (
    entity: Workspace | Doc | null,
    userId: string | null,
) => {
    const result = {
        editable: false,
        configurable: false,
    };
    if (!entity || !userId) return result;
    if (entity.admins.includes(userId)) {
        result.editable = true;
        result.configurable = true;
    }
    if (entity.members.includes(userId)) {
        result.editable = true;
    }
    return result;
};

export const getRawContent = (doc: Doc) => {
    switch (doc.docType) {
        case DocType.Text:
            return `# ${doc.name}\n\n${doc.content}`;
        case DocType.Markdown:
            return `# ${doc.name}\n\n${doc.content}`;
        default:
            return '';
    }
};

export const copyDocumentContent = async (doc: Doc): Promise<boolean> => {
    const content = getRawContent(doc);
    try {
        await navigator.clipboard.writeText(content);
        return true;
    } catch {
        return false;
    }
};

export const downloadDocument = (doc: Doc): void => {
    const content = getRawContent(doc);
    let ext = 'txt';
    switch (doc.docType) {
        case DocType.Text:
        case DocType.Markdown:
            ext = 'md';
            break;
    }
    const filename = `${doc.name || '未命名'}.${ext}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};
