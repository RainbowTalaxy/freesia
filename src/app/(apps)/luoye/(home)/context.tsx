'use client';

import API, { clientFetch } from '@/app/api';
import { WorkspaceItem } from '@/app/api/luoye';
import { ReactNode, createContext, useState } from 'react';
import { splitWorkspace } from '../configs';

export const HomeContext = createContext<{
    workspaces?: WorkspaceItem[];
    userWorkspace?: WorkspaceItem;
    allWorkspaces?: WorkspaceItem[] | null;
    setAllWorkspaces: (workspaces: WorkspaceItem[]) => void;
    refresh: () => void;
}>({
    refresh: () => {},
    setAllWorkspaces: () => {},
});

interface Props {
    userId?: string | null;
    allWorkspaces?: WorkspaceItem[] | null;
    children: ReactNode;
}

export const HomeContextProvider = ({ userId, allWorkspaces: _allWorkspaces, children }: Props) => {
    const [allWorkspaces, setAllWorkspaces] = useState<WorkspaceItem[] | null | undefined>(_allWorkspaces);

    const workspaceInfo = userId && allWorkspaces ? splitWorkspace(allWorkspaces, userId) : {};

    return (
        <HomeContext.Provider
            value={{
                allWorkspaces,
                ...workspaceInfo,
                setAllWorkspaces,
                refresh: async () => {
                    if (!userId) return;
                    const _allWorkspaces = await clientFetch(API.luoye.workspaceItems());
                    setAllWorkspaces(_allWorkspaces);
                },
            }}
        >
            {children}
        </HomeContext.Provider>
    );
};
