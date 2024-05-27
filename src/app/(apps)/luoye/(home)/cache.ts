import API from '@/app/api';
import Server, { serverFetch } from '@/app/api/server';
import { splitWorkspace } from '../configs';
import { cache } from 'react';

export const fetchHomeInfo = cache(async () => {
    const userId = await Server.userId();

    if (!userId) return null;

    const _workspaces = await serverFetch(API.luoye.workspaceItems());
    const splitWorkspaces = splitWorkspace(_workspaces, userId);
    const defaultWorkspace = splitWorkspaces.defaultWorkspace;
    const workspaces = splitWorkspaces.workspaces;
    const allWorkspaces = [defaultWorkspace, ...workspaces];

    return {
        userId,
        defaultWorkspace,
        workspaces,
        allWorkspaces,
    };
});
