import { serverFetch } from '@/app/api/server';
import Welcome from './pages/Welcome';
import API from '@/app/api';
import { fetchHomeInfo } from './cache';

export default async function Home() {
    const homeInfo = await fetchHomeInfo();

    if (!homeInfo) return null;

    const { userId, defaultWorkspace, workspaces } = homeInfo;
    const recentDocs = await serverFetch(API.luoye.recentDocs());

    return (
        <Welcome userId={userId} defaultWorkspace={defaultWorkspace} workspaces={workspaces} recentDocs={recentDocs} />
    );
}
