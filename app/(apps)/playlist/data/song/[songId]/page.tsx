import style from './style.module.css';
import API from '@/api';
import { serverFetch } from '@/api/server';
import Cover from '../../components/Cover';
import SongActions from './containers/SongActions';

interface Props {
    params: {
        songId: string;
    };
}

export async function generateMetadata({ params }: Props) {
    const { songId } = params;
    const song = await serverFetch(API.playlist.song(songId));
    return {
        title: song.name,
    };
}

export default async function Page({ params }: Props) {
    const { songId } = params;
    const song = await serverFetch(API.playlist.song(songId));

    return (
        <div className="page">
            <div className={style.songMain}>
                <Cover
                    className={style.albumCover}
                    url={song.albumImgUrl}
                    size={120}
                />
                <div className={style.songInfo}>
                    <h1 className={style.songName}>{song.name}</h1>
                    <p className={style.artist}>{song.artist}</p>
                    <SongActions song={song} />
                </div>
            </div>
        </div>
    );
}
