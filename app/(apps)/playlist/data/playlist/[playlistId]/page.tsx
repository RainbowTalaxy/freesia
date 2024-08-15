import styles from './style.module.css';
import API from '@/api';
import { serverFetch } from '@/api/server';
import Cover from '../../components/Cover';
import PlaylistActions from './containers/PlaylistActions';
import List, { ListItem } from '../../components/List';
import Placeholder from '../../components/Placeholder';
import SongListItem from '../../components/SongListItem';
import { msToDurationText } from '@/(apps)/playlist/utils';

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
                <Cover
                    className={styles.playlistCover}
                    url={playlist.coverImgUrl}
                />
                <div className={styles.playlistInfo}>
                    <h1 className={styles.playlistName}>{playlist.name}</h1>
                    <p className={styles.playlistDescription}>
                        {playlist.description}
                    </p>
                    <PlaylistActions playlist={playlist} />
                </div>
            </div>
            <List>
                {playlist.songs.length === 0 && (
                    <ListItem>
                        <Placeholder>暂无歌曲</Placeholder>
                    </ListItem>
                )}
                {playlist.songs.map((song) => (
                    <SongListItem
                        key={song.id}
                        playlist={playlist}
                        song={song}
                    />
                ))}
            </List>
            {playlist.songs.length > 0 && (
                <span className={styles.totalDuration}>
                    {playlist.songs.length}首歌，
                    {msToDurationText(
                        playlist.songs.reduce(
                            (total, song) => total + song.duration,
                            0,
                        ),
                    )}
                </span>
            )}
        </div>
    );
}
