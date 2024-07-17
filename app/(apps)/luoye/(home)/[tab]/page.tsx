import Server, { serverFetch } from '../../../../api/server';
import DocBin from '../pages/DocBin';
import Settings from '../pages/Settings';
import API from '../../../../api';
import WorkspaceInfo from '../pages/WorkspaceInfo';

interface Props {
    params: {
        tab: string;
    };
}

export default async function Page({ params }: Props) {
    const { tab } = params;
    const userId = await Server.userId();

    switch (tab) {
        case 'doc-bin':
            return <DocBin />;
        case 'settings':
            if (userId) return <Settings userId={userId} />;
        case 'workspace':
            if (userId) {
                const workspace = await serverFetch(
                    API.luoye.workspace(userId),
                );
                return <WorkspaceInfo userId={userId} data={workspace} />;
            }
        default:
            return null;
    }
}
