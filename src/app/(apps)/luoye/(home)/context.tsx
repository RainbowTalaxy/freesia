'use client';
import API, { clientFetch } from '@/app/api';
import { WorkspaceItem } from '@/app/api/luoye';
import { ReactNode } from 'react';
import { splitWorkspace } from '../configs';
import { Provider, atom, createStore } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';

const userIdAtom = atom<string | null>(null);
const allWorkspacesAtom = atom<WorkspaceItem[] | null>(null);
const workspaceCategoryAtom = atom<{
    workspaces: WorkspaceItem[] | null;
    userWorkspace: WorkspaceItem | null;
}>((get) => {
    const userId = get(userIdAtom);
    const allWorkspaces = get(allWorkspacesAtom);
    return userId && allWorkspaces
        ? splitWorkspace(allWorkspaces, userId)
        : {
              workspaces: null,
              userWorkspace: null,
          };
});

const store = createStore();

export const Context = {
    store,
    atoms: {
        userId: userIdAtom,
        allWorkspaces: allWorkspacesAtom,
        workspaceCategory: workspaceCategoryAtom,
    },
    refresh: async () => {
        const userId = store.get(userIdAtom);
        if (!userId) return;
        const allWorkspaces = await clientFetch(API.luoye.workspaceItems());
        store.set(allWorkspacesAtom, allWorkspaces);
    },
};

interface Props {
    userId: string | null;
    allWorkspaces: WorkspaceItem[] | null;
    children: ReactNode;
}

export const ContextProvider = ({ userId, allWorkspaces, children }: Props) => {
    useHydrateAtoms(
        [
            [userIdAtom, userId],
            [allWorkspacesAtom, allWorkspaces],
        ],
        {
            store,
        },
    );

    return <Provider store={store}>{children}</Provider>;
};
