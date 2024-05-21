import API from '@/app/api';
import { Workspace } from '@/app/api/luoye';
import Server, { serverFetch } from '@/app/api/server';
import WorkspaceInfo from '../../pages/WorkspaceInfo';

interface Props {
    params: {
        workspaceId: string;
    };
}

export default async function Page({ params }: Props) {
    const { workspaceId } = params;
    const userId = await Server.userId();

    let workspace: Workspace | null = null;
    if (userId) {
        workspace = await serverFetch(API.luoye.workspace(workspaceId));
    }

    if (!userId || !workspace) return null;

    return <WorkspaceInfo userId={userId} data={workspace} />;
}
