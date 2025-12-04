import API from '@/api';
import { serverFetch } from '@/api/server';
import PlayerPreview from './PlayerPreview';

interface Props {
    params: {
        playlistId: string;
    };
}

export default async function Page({ params }: Props) {
    const { playlistId } = params;
    const playlist = await serverFetch(API.playlist.playlist(playlistId));

    return <PlayerPreview playlist={playlist} />;
}
