'use client';
import API, { clientFetch } from '@/app/api';
import { Doc, Workspace } from '@/app/api/luoye';
import { Logger, Path } from '@/app/utils';
import { ReactNode, createContext, useCallback, useEffect, useRef, useState } from 'react';
import { LEAVE_EDITING_TEXT, generateDocPageTitle } from '../../configs';
import { usePathname } from 'next/navigation';
import Toast from '../../components/Notification/Toast';
import useHydrationState from '@/app/hooks/useHydrationState';

export const DocContext = createContext<{
    userId: string | null;
    isLoading: boolean;
    isEditing: boolean;
    doc: Doc | null;
    workspace: Workspace | null;
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
    setEditing: () => {},
    setWorkspace: () => {},
    updateDoc: () => {},
    navigateDoc: () => {},
});

type Props = {
    userId: string | null;
    doc: Doc | null;
    workspace: Workspace | null;
    children: ReactNode;
};

const path = '/luoye/doc/[docId]';

export const DocContextProvider = ({ userId, doc: _doc, workspace: _workspace, children }: Props) => {
    const pathname = usePathname();
    const [doc, setDoc] = useHydrationState<Doc | null>(_doc, `${path}.doc`);
    const [workspace, setWorkspace] = useHydrationState<Workspace | null>(_workspace, `${path}.workspace`);
    const [isLoading, setLoading] = useState(false);
    const editingRequest = useRef(false);
    const [isEditing, setEditing] = useState(doc?.content.length === 0);
    const abortController = useRef(new AbortController());

    const changeDoc = useCallback(
        async (id: string) => {
            setLoading(true);
            if (editingRequest.current) {
                setEditing(true);
                editingRequest.current = false;
            } else {
                setEditing(false);
            }
            abortController.current.abort('navigate');
            try {
                abortController.current = new AbortController();
                const newDoc = await clientFetch(API.luoye.doc(id), abortController.current);
                setDoc(newDoc);
                setLoading(false);
            } catch (error: any) {
                if (error.name === 'AbortError') return;
                Logger.error(error.message);
                Toast.notify(error.message);
            }
        },
        [setDoc],
    );

    useEffect(() => {
        const { docId } = /\/luoye\/doc\/(?<docId>[^/]+)$/.exec(pathname)?.groups ?? {
            docId: doc?.id,
        };
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
