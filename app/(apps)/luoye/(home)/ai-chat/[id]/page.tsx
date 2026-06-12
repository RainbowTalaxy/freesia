import Server from '@/api/server';
import AiChat from '../../pages/AiChat';

export default async function Page() {
    const userId = await Server.userId();

    if (!userId) return null;

    return <AiChat />;
}
