'use client';
import API, { clientFetch } from '@/app/api';
import { WorkspaceItem } from '@/app/api/luoye';
import { ReactNode, createContext } from 'react';
import { splitWorkspace } from '../configs';
import useHydrationState from '@/app/hooks/useHydrationState';

export const HomeContext = createContext<{
    userId: string | null;
    workspaces: WorkspaceItem[] | null;
    userWorkspace: WorkspaceItem | null;
    allWorkspaces: WorkspaceItem[] | null;
    setAllWorkspaces: (workspaces: WorkspaceItem[]) => void;
    refreshContext: () => void;
}>({
    userId: null,
    workspaces: null,
    userWorkspace: null,
    allWorkspaces: null,
    refreshContext: () => {},
    setAllWorkspaces: () => {},
});

interface Props {
    userId: string | null;
    allWorkspaces: WorkspaceItem[] | null;
    children: ReactNode;
}

const PATH = '/luoye/home';

export const HomeContextProvider = ({ userId, allWorkspaces: _allWorkspaces, children }: Props) => {
    const [allWorkspaces, setAllWorkspaces] = useHydrationState<WorkspaceItem[] | null>(
        _allWorkspaces,
        `${PATH}-allWorkspaces`,
    );

    const workspaceInfo =
        userId && allWorkspaces
            ? splitWorkspace(allWorkspaces, userId)
            : {
                  workspaces: null,
                  userWorkspace: null,
              };

    return (
        <HomeContext.Provider
            value={{
                userId,
                allWorkspaces,
                ...workspaceInfo,
                setAllWorkspaces,
                refreshContext: async () => {
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
