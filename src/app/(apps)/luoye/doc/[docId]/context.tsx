'use client';
import API, { clientFetch } from '@/app/api';
import { Doc, Workspace } from '@/app/api/luoye';
import { Logger, Path } from '@/app/utils';
import { ReactNode, createContext, useCallback, useEffect, useRef, useState } from 'react';
import { LEAVE_EDITING_TEXT, generateDocPageTitle } from '../../configs';
import { usePathname } from 'next/navigation';
import Toast from '../../components/Notification/Toast';

export const DocContext = createContext<{
    userId: string | null;
    isLoading: boolean;
    isEditing: boolean;
    doc: Doc | null;
    workspace: Workspace | null;
    setEditing: (editing: boolean) => void;
    setWorkspace: (newWorkspace: Workspace) => void;
    updateDoc: (newDoc: Doc, needUpdateWorkspace?: boolean) => void;
    navigateDoc: (id: string) => void;
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

export const DocContextProvider = ({ userId, doc: _doc, workspace: _workspace, children }: Props) => {
    const pathname = usePathname();
    const [isLoading, setLoading] = useState(false);
    const [isEditing, setEditing] = useState(_doc?.content.length === 0);
    const [doc, setDoc] = useState<Doc | null>(_doc);
    const fetchAbortController = useRef(new AbortController());
    const [workspace, setWorkspace] = useState<Workspace | null>(_workspace);

    const changeDoc = useCallback(async (id: string) => {
        setLoading(true);
        setEditing(false);
        fetchAbortController.current.abort('navigate');
        try {
            fetchAbortController.current = new AbortController();
            const newDoc = await clientFetch(API.luoye.doc(id), fetchAbortController.current);
            document.title = generateDocPageTitle(newDoc);
            setDoc(newDoc);
            setLoading(false);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            Logger.error(error.message);
            Toast.notify(error.message);
        }
    }, []);

    useEffect(() => {
        const { docId } = /\/luoye\/doc\/(?<docId>[^/]+)$/.exec(pathname)?.groups ?? {
            docId: doc?.id,
        };
        if (docId && doc && docId !== doc.id) changeDoc(docId);
    }, [changeDoc, doc, pathname]);

    // 初始化
    useEffect(() => {
        setLoading(false);
        setEditing(_doc?.content.length === 0);
        setDoc(_doc);
        setWorkspace(_workspace);
    }, [_doc, _workspace]);

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
                navigateDoc: (id: string) => {
                    if (doc?.id === id) return;
                    if (isEditing) {
                        const result = confirm(LEAVE_EDITING_TEXT);
                        if (!result) return;
                    }
                    history.pushState(null, '', Path.of(`/luoye/doc/${id}`));
                },
            }}
        >
            {children}
        </DocContext.Provider>
    );
};
