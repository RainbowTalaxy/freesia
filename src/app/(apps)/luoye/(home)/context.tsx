'use client';
import API, { clientFetch } from '@/app/api';
import { WorkspaceItem } from '@/app/api/luoye';
import { ReactNode, createContext, useContext, useRef } from 'react';
import { splitWorkspace } from '../configs';
import { createStore, useStore } from 'zustand';

interface HomeContext {
    userId: string | null;
    workspaces: WorkspaceItem[] | null;
    userWorkspace: WorkspaceItem | null;
    allWorkspaces: WorkspaceItem[] | null;
    setAllWorkspaces: (workspaces: WorkspaceItem[]) => void;
    refreshContext: () => void;
}

interface ContextProps {
    userId: string | null;
    allWorkspaces: WorkspaceItem[] | null;
}

const createHomeStore = ({ userId, allWorkspaces }: ContextProps) => {
    const { workspaces, userWorkspace } =
        userId && allWorkspaces
            ? splitWorkspace(allWorkspaces, userId)
            : {
                  workspaces: null,
                  userWorkspace: null,
              };
    return createStore<HomeContext>()((set, get) => ({
        userId,
        workspaces,
        userWorkspace,
        allWorkspaces,
        setAllWorkspaces: (workspaces: WorkspaceItem[]) => {
            const userId = get().userId;
            if (!userId) return;
            set({ allWorkspaces: workspaces, ...splitWorkspace(workspaces, userId) });
        },
        refreshContext: async () => {
            if (!get().userId) return;
            const _allWorkspaces = await clientFetch(API.luoye.workspaceItems());
            get().setAllWorkspaces(_allWorkspaces);
        },
    }));
};

const HomeContext = createContext<ReturnType<typeof createHomeStore> | null>(null);

export function useHomeContext<T>(selector: (state: HomeContext) => T): T {
    const store = useContext(HomeContext);
    if (!store) throw new Error('lack of `HomeContextProvider` when using `useHomeContext`');
    return useStore(store, selector);
}

type Props = ContextProps & {
    children: ReactNode;
};

export const HomeContextProvider = ({ userId, allWorkspaces, children }: Props) => {
    const store = useRef(createHomeStore({ userId, allWorkspaces }));

    return <HomeContext.Provider value={store.current}>{children}</HomeContext.Provider>;
};
