'use client';
import API, { clientFetch } from '@/api';
import { msToDurationNumText } from '../../../utils';
import Cover from '../Cover';
import { ListItem } from '../List';
import style from './style.module.css';
import { Playlist, SongItem } from '@/api/playlist';
import { useRouter } from 'next/navigation';

interface Props {
    playlist?: Playlist;
    song: SongItem;
}

const SongListItem = ({ playlist, song }: Props) => {
    const router = useRouter();

    return (
        <ListItem onClick={() => router.push(`/playlist/data/song/${song.id}`)}>
            <Cover url={song.tinyAlbumImgUrl} size={36} />
            <div className={style.listItemName}>{song.name}</div>
            <div className={style.listItemArtist}>{song.artist}</div>
            <div className={style.listItemDuration}>
                {msToDurationNumText(song.duration)}
            </div>
            <div
                className={style.listItemAction}
                onClick={async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const granted = confirm(`确定删除 ${song.name} 吗？`);
                    if (!granted) return;
                    try {
                        if (playlist) {
                            await clientFetch(
                                API.playlist.removeSongFromPlaylist(
                                    playlist.id,
                                    song.id,
                                ),
                            );
                        } else {
                            await clientFetch(API.playlist.deleteSong(song.id));
                        }
                        router.refresh();
                    } catch {
                        alert('删除失败');
                    }
                }}
            >
                删除
            </div>
        </ListItem>
    );
};

export default SongListItem;
