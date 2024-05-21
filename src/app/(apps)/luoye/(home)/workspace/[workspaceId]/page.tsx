import API from '@/app/api';
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

    if (!userId) return null;

    const workspace = await serverFetch(API.luoye.workspace(workspaceId));

    return <WorkspaceInfo userId={userId} data={workspace} />;
}
