'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import API, { clientFetch } from '@/api';
import { Button, Input } from '@/components/form';
import { Logger } from '@/utils';
import styles from '../styles/form.module.css';
import { Song } from '@/api/playlist';

interface Props {
    song?: Song;
    onClose: (newSong?: Song) => Promise<void>;
}

const SongForm = ({ song, onClose }: Props) => {
    const nameRef = useRef<HTMLInputElement>(null);
    const artistRef = useRef<HTMLInputElement>(null);
    const albumRef = useRef<HTMLInputElement>(null);
    const durationRef = useRef<HTMLInputElement>(null);
    const albumImgUrlRef = useRef<HTMLInputElement>(null);
    const tinyAlbumImgUrlRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (song) {
            nameRef.current!.value = song.name;
            artistRef.current!.value = song.artist;
            albumRef.current!.value = song.album;
            durationRef.current!.value = String(song.duration);
            albumImgUrlRef.current!.value = song.albumImgUrl ?? '';
            tinyAlbumImgUrlRef.current!.value = song.tinyAlbumImgUrl ?? '';
        }
    }, [song]);

    const handleSubmit = async () => {
        if (!nameRef.current!.value) return alert('请输入标题');
        const props = {
            name: nameRef.current!.value,
            artist: artistRef.current!.value,
            album: albumRef.current!.value,
            duration: Number(durationRef.current!.value),
            albumImgUrl: albumImgUrlRef.current!.value || null,
            tinyAlbumImgUrl: tinyAlbumImgUrlRef.current!.value || null,
        };
        try {
            let newSong: Song;
            if (song) {
                newSong = await clientFetch(API.playlist.updateSong(song.id, props));
            } else {
                newSong = await clientFetch(API.playlist.addSong(props));
            }
            await onClose(newSong);
        } catch (error: any) {
            Logger.error('歌曲信息更新失败', error);
            alert(error.message);
        }
    };

    return createPortal(
        <div className={styles.container}>
            <div className={styles.form} style={{ ['--field-label-width' as string]: '8em' }}>
                <h2>{song ? '编辑歌曲' : '新建歌曲'}</h2>
                <div className={clsx(styles.formItem)}>
                    <label>
                        <span>*</span>歌曲名：
                    </label>
                    <Input raf={nameRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>艺术家：</label>
                    <Input raf={artistRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>专辑：</label>
                    <Input raf={albumRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>时长：</label>
                    <Input raf={durationRef} type="number" />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>专辑图 URL：</label>
                    <Input raf={albumImgUrlRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>小专辑图 URL：</label>
                    <Input raf={tinyAlbumImgUrlRef} />
                </div>
                <div className={styles.formItem}>
                    <label></label>
                    <div className={styles.options}>
                        <Button type="primary" onClick={handleSubmit}>
                            {song ? '保 存' : '创 建'}
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

export default SongForm;
