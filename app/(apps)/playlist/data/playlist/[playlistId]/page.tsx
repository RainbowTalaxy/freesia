import style from '../../styles/playlist.module.css';
import API from '@/api';
import { serverFetch } from '@/api/server';
import Cover from '../../components/Cover';
import PlaylistActions from './containers/PlaylistActions';

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
        <div className="page">
            <div className={style.playlistMain}>
                <Cover
                    className={style.playlistCover}
                    url={playlist.coverImgUrl}
                />
                <div className={style.playlistInfo}>
                    <h1 className={style.playlistName}>{playlist.name}</h1>
                    <p className={style.playlistDescription}>
                        {playlist.description}
                    </p>
                    <PlaylistActions playlist={playlist} />
                </div>
            </div>
        </div>
    );
}
