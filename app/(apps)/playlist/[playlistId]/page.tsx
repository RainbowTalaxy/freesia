import API from '@/api';
import { serverFetch } from '@/api/server';
import Effect from './effect';
import dynamic from 'next/dynamic';

const MusicPanel = dynamic(() => import('../components/MusicPanel'), {
    ssr: false,
});

interface Props {
    params: {
        playlistId: string;
    };
}

export async function generateMetadata({ params }: Props) {
    const { playlistId } = params;
    const playlist = await serverFetch(API.playlist.playlist(playlistId));
    return {
        title: playlist.name,
    };
}

export default async function Page({ params }: Props) {
    const { playlistId } = params;
    const playlist = await serverFetch(API.playlist.playlist(playlistId));

    return (
        <>
            <h1>Playlist</h1>
            <MusicPanel />
            <Effect playlist={playlist} />
        </>
    );
}
