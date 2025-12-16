'use client';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import API, { clientFetch } from '@/api';
import { Button, TextArea } from '@/components/form';
import { Logger } from '@/utils';
import styles from '../styles/form.module.css';
import { Song } from '@/api/playlist';

interface Props {
    onClose: (newSongs?: Song[]) => void | Promise<void>;
}

const BatchAddSongForm = ({ onClose }: Props) => {
    const jsonRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async () => {
        const songs = JSON.parse(jsonRef.current!.value);
        if (!Array.isArray(songs)) return alert('数据格式错误');
        if (songs.some((song: any) => !song.name)) {
            return alert('请检查歌名');
        }
        try {
            const newSongs = await Promise.all(
                songs.map(async (song: any) => {
                    const props = {
                        name: song.name,
                        artist: song.artist,
                        album: song.album,
                        duration: Number(song.duration),
                        albumImgUrl: song.albumImgUrl || null,
                        tinyAlbumImgUrl: song.tinyAlbumImgUrl || null,
                    };
                    return await clientFetch(API.playlist.addSong(props));
                }),
            );
            await onClose(newSongs);
        } catch (error: any) {
            Logger.error('歌曲上传失败', error);
            alert(error.message);
        }
    };

    return createPortal(
        <div className={styles.container}>
            <div className={styles.form} style={{ ['--field-label-width' as string]: '8em' }}>
                <h2>批量上传歌曲</h2>
                <div className={clsx(styles.formItem)}>
                    <label>
                        <span>*</span>数据：
                    </label>
                    <TextArea raf={jsonRef} />
                </div>
                <div className={styles.formItem}>
                    <label></label>
                    <div className={styles.options}>
                        <Button type="primary" onClick={handleSubmit}>
                            {'上 传'}
                        </Button>
                        <Button onClick={() => onClose()}>取 消</Button>
                    </div>
                </div>
            </div>
            <div className={styles.mask} onClick={() => onClose()} />
        </div>,
        document.body,
    );
};

export default BatchAddSongForm;
