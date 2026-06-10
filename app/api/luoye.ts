import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';
import { ActionResult } from './types';
import { BASE_PATH } from '../constants';
import {
    Doc,
    DocBinItem,
    DocDir,
    DocItem,
    DocType,
    Scope,
    SearchResultItem,
    Workspace,
    WorkspaceItem,
    ChatSession,
    ChatSessionSummary,
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
        Rocket.delete<ActionResult>(`${API_PREFIX}/luoye/recent-docs/${id}`),
    tags: () => Rocket.get<string[]>(`${API_PREFIX}/luoye/tags`),
    docs: () => Rocket.get<DocItem[]>(`${API_PREFIX}/luoye/docs`),
    doc: (id: string) => Rocket.get<Doc>(`${API_PREFIX}/luoye/doc/${id}`),
    createDoc: (
        workspaceId: string,
        props: {
            name?: string;
            scope?: Scope;
            date?: number;
            docType?: DocType;
            tags?: string[];
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
            workspaces?: string[];
            tags?: string[];
        },
    ) => Rocket.put<Doc>(`${API_PREFIX}/luoye/doc/${id}`, props),
    deleteDoc: (id: string) =>
        Rocket.delete<ActionResult>(`${API_PREFIX}/luoye/doc/${id}`),
    docBin: () => Rocket.get<DocBinItem[]>(`${API_PREFIX}/luoye/doc-bin`),
    restoreDoc: (id: string) =>
        Rocket.put<ActionResult>(`${API_PREFIX}/luoye/doc/${id}/restore`),
    search: (query: {
        keyword: string;
        workspaceId?: string;
        limit?: number;
    }) => Rocket.get<SearchResultItem[]>(`${API_PREFIX}/luoye/search`, query),
    ai: {
        hello: () =>
            Rocket.post<{ message: string }>(`${BASE_PATH}/luoye/ai/hello`),
        doc: {
            tags: (docId: string) =>
                Rocket.post<{ tags: string[] }>(
                    `${BASE_PATH}/luoye/ai/doc/${docId}/tags`,
                ),
        },
        chat: {
            send: (props: {
                docId?: string;
                message: string;
                sessionId?: string;
            }) => Rocket.post(`${BASE_PATH}/luoye/ai/chat`, props),
            listSessions: (query?: { docId?: string; limit?: number }) =>
                Rocket.get<ChatSessionSummary[]>(
                    `${API_PREFIX}/luoye/chat-sessions`,
                    query,
                ),
            createSession: (props?: { docId?: string; docUpdatedAt?: number }) =>
                Rocket.post<ChatSession>(
                    `${API_PREFIX}/luoye/chat-sessions`,
                    props,
                ),
            getSession: (sessionId: string) =>
                Rocket.get<ChatSession>(
                    `${API_PREFIX}/luoye/chat-sessions/${sessionId}`,
                ),
            updateSession: (
                sessionId: string,
                props: { title?: string; docUpdatedAt?: number },
            ) =>
                Rocket.patch<ChatSession>(
                    `${API_PREFIX}/luoye/chat-sessions/${sessionId}`,
                    props,
                ),
            appendMessage: (
                sessionId: string,
                props: { message: ChatSession['messages'][number] },
            ) =>
                Rocket.post<ChatSession>(
                    `${API_PREFIX}/luoye/chat-sessions/${sessionId}/messages`,
                    props,
                ),
            updateToolCall: (
                sessionId: string,
                runId: string,
                props: { status?: string; output?: unknown; content?: string },
            ) =>
                Rocket.patch<ChatSession>(
                    `${API_PREFIX}/luoye/chat-sessions/${sessionId}/tool-calls/${runId}`,
                    props,
                ),
            deleteSession: (sessionId: string) =>
                Rocket.delete<ActionResult>(
                    `${API_PREFIX}/luoye/chat-sessions/${sessionId}`,
                ),
            abort: (sessionId: string) =>
                Rocket.post<ActionResult>(
                    `${BASE_PATH}/luoye/ai/chat/${sessionId}/abort`,
                ),
            confirmSave: (
                sessionId: string,
                props: { confirmed: boolean; runId: string },
            ) =>
                Rocket.post<ActionResult>(
                    `${BASE_PATH}/luoye/ai/chat/${sessionId}/confirm-save`,
                    props,
                ),
        },
    },
};

export default LuoyeAPI;
export * from './types/luoye';
