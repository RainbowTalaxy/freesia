import Server, { serverFetch } from '@/app/api/server';
import Welcome from './pages/Welcome';
import { DocItem, WorkspaceItem } from '@/app/api/luoye';
import API from '@/app/api';
import { splitWorkspace } from '../configs';

export default async function Home() {
    const userId = await Server.userId();

    let workspaces: WorkspaceItem[] | null = null;
    let recentDocs: DocItem[] | null = null;
    let defaultWorkspace: WorkspaceItem | null = null;
    let allWorkspaces: WorkspaceItem[] | null = null;
    if (userId) {
        const [_workspaces, _recentDocs] = await Promise.all([
            serverFetch(API.luoye.workspaceItems()),
            serverFetch(API.luoye.recentDocs()),
        ]);
        recentDocs = _recentDocs;
        const splitWorkspaces = splitWorkspace(_workspaces, userId);
        defaultWorkspace = splitWorkspaces.defaultWorkspace;
        workspaces = splitWorkspaces.workspaces;
        allWorkspaces = [defaultWorkspace, ...workspaces];
    }

    if (!userId || !defaultWorkspace || !workspaces || !recentDocs) return;

    return (
        <Welcome userId={userId} defaultWorkspace={defaultWorkspace} workspaces={workspaces} recentDocs={recentDocs} />
    );
}
