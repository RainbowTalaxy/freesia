'use client';
import API, { clientFetch } from '@/app/api';
import { Doc, Workspace } from '@/app/api/luoye';
import { Logger, Path } from '@/app/utils';
import { ReactNode, useEffect } from 'react';
import { LEAVE_EDITING_TEXT, generateDocPageTitle } from '../../configs';
import { usePathname } from 'next/navigation';
import Toast from '../../components/Notification/Toast';
import { Provider, atom, createStore } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

const userIdAtom = atom<string | null>(null);
const docAtom = atom<Doc | null>(null);
const workspaceAtom = atom<Workspace | null>(null);
const isEditingAtom = atom<boolean>(false);
const isLoadingAtom = atom<boolean>(false);

const store = createStore();

const changeDoc = (() => {
    let fetchAbortController = new AbortController();

    return async (id: string) => {
        store.set(isLoadingAtom, true);
        store.set(isEditingAtom, false);
        fetchAbortController.abort('navigate');
        try {
            fetchAbortController = new AbortController();
            const newDoc = await clientFetch(API.luoye.doc(id), fetchAbortController);
            document.title = generateDocPageTitle(newDoc);
            store.set(docAtom, newDoc);
            store.set(isLoadingAtom, false);
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            Logger.error(error.message);
            Toast.notify(error.message);
        }
    };
})();

export const Context = {
    store,
    atoms: {
        userId: userIdAtom,
        doc: docAtom,
        workspace: workspaceAtom,
        isEditing: isEditingAtom,
        isLoading: isLoadingAtom,
    },
    updateDoc: async (newDoc: Doc, needUpdateWorkspace = true) => {
        store.set(docAtom, newDoc);
        if (!needUpdateWorkspace) return;
        const newWorkspace = await clientFetch(API.luoye.workspace(newDoc.workspaces[0]));
        store.set(workspaceAtom, newWorkspace);
    },
    navigateDoc: (id: string) => {
        const doc = store.get(docAtom);
        if (doc?.id === id) return;
        if (store.get(isEditingAtom)) {
            const result = confirm(LEAVE_EDITING_TEXT);
            if (!result) return;
        }
        history.pushState(null, '', Path.of(`/luoye/doc/${id}`));
    },
};

type Props = {
    userId: string | null;
    doc: Doc | null;
    workspace: Workspace | null;
    children: ReactNode;
};

export const ContextProvider = ({ userId, doc: _doc, workspace: _workspace, children }: Props) => {
    const pathname = usePathname();

    useHydrateAtoms(
        [
            [userIdAtom, userId],
            [docAtom, _doc],
            [workspaceAtom, _workspace],
        ],
        {
            store,
        },
    );

    useEffect(() => {
        const doc = store.get(docAtom);
        const { docId } = /\/luoye\/doc\/(?<docId>[^/]+)$/.exec(pathname)?.groups ?? {
            docId: doc?.id,
        };
        if (docId && doc && docId !== doc.id) changeDoc(docId);
    }, [pathname]);

    // 初始化
    useEffect(() => {
        store.set(isLoadingAtom, false);
        store.set(isEditingAtom, _doc?.content.length === 0);
        store.set(docAtom, _doc);
        store.set(workspaceAtom, _workspace);
    }, [_doc, _workspace]);

    return <Provider store={store}>{children}</Provider>;
};
