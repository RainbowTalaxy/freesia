import Server, { serverFetch } from '@/app/api/server';
import DocBin from '../pages/DocBin';
import Settings from '../pages/Settings';
import API from '@/app/api';
import WorkspaceInfo from '../pages/WorkspaceInfo';

interface Props {
    params: {
        tab: string;
    };
}

export default async function Page({ params }: Props) {
    const { tab } = params;

    switch (tab) {
        case 'doc-bin':
            return <DocBin />;
        case 'settings':
            return <Settings />;
        case 'workspace':
            const userId = await Server.userId();
            if (userId) {
                const workspace = await serverFetch(API.luoye.workspace(userId));
                return <WorkspaceInfo userId={userId} data={workspace} />;
            }
        default:
            return null;
    }
}
