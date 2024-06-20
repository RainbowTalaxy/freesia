'use client';
import API, { clientFetch } from '@/app/api';
import { WorkspaceItem } from '@/app/api/luoye';
import { ReactNode } from 'react';
import { splitWorkspace } from '../configs';
import { create } from 'zustand';
import useHydrationEffect from '@/app/hooks/useHydrationEffect';

export let useHomeStore = create<{
    userId: string | null;
    workspaces: WorkspaceItem[] | null;
    userWorkspace: WorkspaceItem | null;
    allWorkspaces: WorkspaceItem[] | null;
    setAllWorkspaces: (workspaces: WorkspaceItem[]) => void;
    refreshContext: () => void;
}>()(() => ({
    userId: null,
    workspaces: null,
    userWorkspace: null,
    allWorkspaces: null,
    setAllWorkspaces: () => {},
    refreshContext: () => {},
}));

interface Props {
    userId: string | null;
    allWorkspaces: WorkspaceItem[] | null;
    children: ReactNode;
}

export const HomeContextProvider = ({ userId, allWorkspaces, children }: Props) => {
    useHydrationEffect(() => {
        const { workspaces, userWorkspace } =
            userId && allWorkspaces
                ? splitWorkspace(allWorkspaces, userId)
                : {
                      workspaces: null,
                      userWorkspace: null,
                  };

        useHomeStore = create((set, get) => ({
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
    });

    return children;
};
