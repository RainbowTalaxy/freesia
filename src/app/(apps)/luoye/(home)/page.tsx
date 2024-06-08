import Server, { serverFetch } from '@/app/api/server';
import Welcome from './pages/Welcome';
import API from '@/app/api';

export default async function Page() {
    const userId = await Server.userId();

    if (!userId) return null;

    const recentDocs = await serverFetch(API.luoye.recentDocs());

    return <Welcome userId={userId} recentDocs={recentDocs} />;
}
