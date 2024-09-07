import styles from './style.module.css';
import API from '@/api';
import { serverFetch } from '@/api/server';
import Cover from '../../components/Cover';
import PlaylistActions from './containers/PlaylistActions';
import { msToDurationText } from '../../../utils';
import SongList from './containers/SongList';
import PlayerControl from '../../../components/player/PlayerControl';
import Effect from './effect';

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
            <div className={styles.playlistMain}>
                <Cover className={styles.playlistCover} url={playlist.coverImgUrl} shadow />
                <div className={styles.playlistInfo}>
                    <h1 className={styles.playlistName}>{playlist.name}</h1>
                    <p className={styles.playlistDescription}>{playlist.description}</p>
                    <PlaylistActions playlist={playlist} />
                </div>
            </div>
            <SongList playlist={playlist} />
            {playlist.songs.length > 0 && (
                <span className={styles.totalDuration}>
                    {playlist.songs.length}首歌，
                    {msToDurationText(playlist.songs.reduce((total, song) => total + song.duration, 0))}
                </span>
            )}
            <Effect playlist={playlist} />
            <div className={styles.bottomBarContainer}>
                <div className={styles.bottomBar}>
                    <PlayerControl />
                </div>
            </div>
        </div>
    );
}
