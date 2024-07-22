import API from '@/api';
import Server, { serverFetch } from '@/api/server';
import Welcome from './pages/Welcome';

export default async function Page() {
    const userId = await Server.userId();

    if (!userId) return null;

    const recentDocs = await serverFetch(API.luoye.recentDocs());

    return <Welcome userId={userId} recentDocs={recentDocs} />;
}
