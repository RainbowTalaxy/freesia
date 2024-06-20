'use client';
import API, { clientFetch } from '@/app/api';
import { Doc, Workspace } from '@/app/api/luoye';
import { Logger, Path } from '@/app/utils';
import { ReactNode, useEffect } from 'react';
import { LEAVE_EDITING_TEXT, generateDocPageTitle } from '../../configs';
import { usePathname } from 'next/navigation';
import Toast from '../../components/Notification/Toast';
import { create } from 'zustand';

export let useDocStore = create<{
    userId: string | null;
    isLoading: boolean;
    isEditing: boolean;
    doc: Doc | null;
    workspace: Workspace | null;
    setEditing: (editing: boolean) => void;
    setWorkspace: (newWorkspace: Workspace) => void;
    updateDoc: (newDoc: Doc, needUpdateWorkspace?: boolean) => void;
    navigateDoc: (id: string) => void;
}>()(() => ({
    userId: null,
    isLoading: false,
    isEditing: false,
    doc: null,
    workspace: null,
    setEditing: () => {},
    setWorkspace: () => {},
    updateDoc: () => {},
    navigateDoc: () => {},
}));

const changeDoc = (() => {
    let fetchAbortController = new AbortController();

    return async (id: string) => {
        useDocStore.setState({
            isLoading: true,
            isEditing: false,
        });
        fetchAbortController.abort('navigate');
        try {
            fetchAbortController = new AbortController();
            const newDoc = await clientFetch(API.luoye.doc(id), fetchAbortController);
            document.title = generateDocPageTitle(newDoc);
            useDocStore.setState({
                isLoading: false,
                doc: newDoc,
            });
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            Logger.error(error.message);
            Toast.notify(error.message);
        }
    };
})();

type Props = {
    userId: string | null;
    doc: Doc | null;
    workspace: Workspace | null;
    children: ReactNode;
};

const isServer = typeof window === 'undefined';
let isStoreCreated = false;

export const DocContextProvider = ({ userId, doc, workspace, children }: Props) => {
    const pathname = usePathname();

    if (isServer || !isStoreCreated) {
        useDocStore = create((set, get) => ({
            userId,
            isLoading: false,
            isEditing: doc?.content.length === 0,
            doc,
            workspace,
            setEditing: (isEditing) => set({ isEditing }),
            setWorkspace: (workspace) => set({ workspace }),
            updateDoc: async (newDoc, needUpdateWorkspace = true) => {
                set({ doc: newDoc });
                if (!needUpdateWorkspace) return;
                const newWorkspace = await clientFetch(API.luoye.workspace(newDoc.workspaces[0]));
                set({ workspace: newWorkspace });
            },
            navigateDoc: (id: string) => {
                const { doc, isEditing } = get();
                if (doc?.id === id) return;
                if (isEditing) {
                    const result = confirm(LEAVE_EDITING_TEXT);
                    if (!result) return;
                }
                history.pushState(null, '', Path.of(`/luoye/doc/${id}`));
            },
        }));
        isStoreCreated = true;
    }

    useEffect(() => {
        const { docId } = /\/luoye\/doc\/(?<docId>[^/]+)$/.exec(pathname)?.groups ?? {
            docId: doc?.id,
        };
        if (docId && doc && docId !== doc.id) changeDoc(docId);
    }, [doc, pathname]);

    // 初始化
    useEffect(() => {
        useDocStore.setState({
            isLoading: false,
            isEditing: doc?.content.length === 0,
            doc,
            workspace,
        });
    }, [doc, workspace]);

    return children;
};
