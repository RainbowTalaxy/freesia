import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';
import { Result } from './types';
import {
    Doc,
    DocBinItem,
    DocDir,
    DocItem,
    DocType,
    Scope,
    Workspace,
    WorkspaceItem,
} from './types/luoye';

const LuoyeAPI = {
    workspaceItems: () =>
        Rocket.get<WorkspaceItem[]>(`${API_PREFIX}/luoye/workspaces`),
    updateWorkspaceItems: (workspaceIds: string[]) =>
        Rocket.put<WorkspaceItem[]>(`${API_PREFIX}/luoye/workspaces`, {
            workspaceIds,
        }),
    workspace: (id: string) =>
        Rocket.get<Workspace>(`${API_PREFIX}/luoye/workspace/${id}`),
    createWorkspace: (props: {
        name: string;
        description?: string;
        scope?: Scope;
    }) => Rocket.post<Workspace>(`${API_PREFIX}/luoye/workspace`, props),
    updateWorkspace: (
        id: string,
        props: {
            name?: string;
            description?: string;
            scope?: Scope;
            docs?: DocDir[];
        },
    ) => Rocket.put<Workspace>(`${API_PREFIX}/luoye/workspace/${id}`, props),
    recentDocs: () => Rocket.get<DocItem[]>(`${API_PREFIX}/luoye/recent-docs`),
    deleteRecentDoc: (id: string) =>
        Rocket.delete<Result>(`${API_PREFIX}/luoye/recent-docs/${id}`),
    docs: () => Rocket.get<DocItem[]>(`${API_PREFIX}/luoye/docs`),
    doc: (id: string) => Rocket.get<Doc>(`${API_PREFIX}/luoye/doc/${id}`),
    createDoc: (
        workspaceId: string,
        props: {
            name?: string;
            scope?: Scope;
            date?: number;
            docType?: DocType;
        },
    ) =>
        Rocket.post<Doc>(`${API_PREFIX}/luoye/doc`, {
            workspaceId,
            ...props,
        }),
    updateDoc: (
        id: string,
        props: {
            name?: string;
            content?: string;
            scope?: Scope;
            date?: number;
        },
    ) => Rocket.put<Doc>(`${API_PREFIX}/luoye/doc/${id}`, props),
    deleteDoc: (id: string) =>
        Rocket.delete<Result>(`${API_PREFIX}/luoye/doc/${id}`),
    docBin: () => Rocket.get<DocBinItem[]>(`${API_PREFIX}/luoye/doc-bin`),
    restoreDoc: (id: string) =>
        Rocket.put<Result>(`${API_PREFIX}/luoye/doc/${id}/restore`),
};

export default LuoyeAPI;
export type * from './types/luoye';
