import { Doc, DocType, Workspace, WorkspaceItem } from '../../../api/luoye';
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
