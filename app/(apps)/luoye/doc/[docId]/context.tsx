'use client';
import { ReactNode, createContext, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import API, { clientFetch } from '@/api';
import { Doc, Workspace, WorkspaceItem } from '@/api/luoye';
import useHydrationState from '@/hooks/useHydrationState';
import { Logger, Path } from '@/utils';
import { LEAVE_EDITING_TEXT, generateDocPageTitle } from '../../configs';
import Toast from '../../components/Notification/Toast';

export const DocContext = createContext<{
    userId: string | null;
    isLoading: boolean;
    isEditing: boolean;
    doc: Doc | null;
    workspace: Workspace | null;
    workspaceItems: WorkspaceItem[] | null;
    setEditing: (editing: boolean) => void;
    setWorkspace: (newWorkspace: Workspace) => void;
    updateDoc: (newDoc: Doc, needUpdateWorkspace?: boolean) => void;
    navigateDoc: (id: string, isEditing?: boolean) => void;
}>({
    userId: null,
    isLoading: false,
    isEditing: false,
    doc: null,
    workspace: null,
    workspaceItems: null,
    setEditing: () => {},
    setWorkspace: () => {},
    updateDoc: () => {},
    navigateDoc: () => {},
});

type Props = {
    userId: string | null;
    doc: Doc | null;
    workspace: Workspace | null;
    workspaceItems: WorkspaceItem[] | null;
    children: ReactNode;
};

const PATH = '/luoye/doc/[docId]';
const ABORT_MESSAGE = 'navigate';

export const DocContextProvider = ({
    userId,
    doc: _doc,
    workspace: _workspace,
    workspaceItems: _workspaceItems,
    children,
}: Props) => {
    const pathname = usePathname();
    const [doc, setDoc] = useHydrationState<Doc | null>(_doc, `${PATH}-doc-${_doc?.id}`);
    const [workspace, setWorkspace] = useHydrationState<Workspace | null>(
        _workspace,
        `${PATH}-workspace-${_workspace?.id}`,
    );
    const [workspaceItems, _] = useHydrationState<WorkspaceItem[] | null>(_workspaceItems, `${PATH}-workspaceItems`);
    const [isLoading, setLoading] = useState(false);
    const editingRequest = useRef(false);
    const [isEditing, setEditing] = useState(doc?.content.length === 0);
    const abortController = useRef<AbortController | null>(null);

    const changeDoc = useCallback(
        async (id: string) => {
            setLoading(true);
            if (editingRequest.current) {
                setEditing(true);
                editingRequest.current = false;
            } else {
                setEditing(false);
            }
            abortController.current?.abort(ABORT_MESSAGE);
            try {
                abortController.current = new AbortController();
                const newDoc = await clientFetch(API.luoye.doc(id), abortController.current);
                setDoc(newDoc);
                setLoading(false);
            } catch (error: any) {
                if (error === ABORT_MESSAGE) return;
                Logger.error('获取文章信息失败', error);
                Toast.notify(error.message);
            }
        },
        [setDoc],
    );

    useEffect(() => {
        const match = /\/luoye\/doc\/([^/]+)$/.exec(pathname);
        const docId = match?.[1] ?? doc?.id;
        if (docId && doc && docId !== doc.id) changeDoc(docId);
    }, [changeDoc, doc, pathname]);

    useEffect(() => {
        setLoading(false);
    }, [_doc, _workspace]);

    useEffect(() => {
        document.title = generateDocPageTitle(doc);
    }, [doc]);

    return (
        <DocContext.Provider
            value={{
                userId,
                isLoading,
                isEditing,
                doc,
                workspace,
                workspaceItems,
                setWorkspace,
                setEditing,
                updateDoc: async (newDoc, needUpdateWorkspace = true) => {
                    setDoc(newDoc);
                    if (!needUpdateWorkspace) return;
                    const newWorkspace = await clientFetch(API.luoye.workspace(newDoc.workspaces[0]));
                    setWorkspace(newWorkspace);
                },
                navigateDoc: (id: string, editing: boolean = false) => {
                    if (doc?.id === id) return;
                    if (isEditing) {
                        const result = confirm(LEAVE_EDITING_TEXT);
                        if (!result) return;
                    }
                    if (editing) editingRequest.current = true;
                    history.pushState(null, '', Path.of(`/luoye/doc/${id}`));
                },
            }}
        >
            {children}
        </DocContext.Provider>
    );
};
