'use client';
import styles from './style.module.css';
import { useEffect, useState } from 'react';
import Popup from '../../../../components/Popup';
import { Playlist, SongItem } from '@/api/playlist';
import API, { clientFetch } from '@/api';
import List, { ListItem } from '../../../../components/List';
import Cover from '../../../../components/Cover';
import Icon from '../../../../components/Icon';
import { Logger } from '@/utils';

interface Props {
    playlist: Playlist;
    onClose: () => void;
}

const SongPicker = ({ playlist, onClose }: Props) => {
    const [songs, setSongs] = useState<SongItem[] | null>(null);
    const [pickedSongIds, setPickedSongIds] = useState<string[]>([]);

    const handleAddSongs = async () => {
        try {
            await clientFetch(API.playlist.addSongsToPlaylist(playlist.id, pickedSongIds));
            onClose();
        } catch (error: any) {
            Logger.error('添加歌曲失败', error);
            alert(error.message);
        }
    };

    useEffect(() => {
        clientFetch(API.playlist.songs()).then((data) =>
            setSongs(data.songs.filter((song) => playlist.songs.every((s) => s.id !== song.id))),
        );
    }, [playlist]);

    return (
        <Popup title="添加歌曲" onDone={handleAddSongs} onClose={onClose}>
            {songs === null ? (
                <div>加载中...</div>
            ) : (
                <List className={styles.list}>
                    {songs?.map((song) => {
                        const isPicked = pickedSongIds.includes(song.id);
                        return (
                            <ListItem
                                key={song.id}
                                className={styles.listItem}
                                onClick={() => {
                                    setPickedSongIds(
                                        isPicked
                                            ? pickedSongIds.filter((id) => id !== song.id)
                                            : [...pickedSongIds, song.id],
                                    );
                                }}
                            >
                                <Cover url={song.tinyAlbumImgUrl} size={36} />
                                <div className={styles.songInfo}>
                                    <div className={styles.songName}>{song.name}</div>
                                    <div className={styles.artist}>{song.artist}</div>
                                </div>
                                <Icon
                                    className={styles.tick}
                                    name={isPicked ? 'check_box' : 'check_box_outline_blank'}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            )}
        </Popup>
    );
};

export default SongPicker;
