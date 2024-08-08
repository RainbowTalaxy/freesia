'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import API, { clientFetch } from '@/api';
import { Button, Input, TextArea } from '@/components/form';
import { Logger, formDate, time } from '@/utils';
import styles from '../styles/form.module.css';
import { Playlist } from '@/api/playlist';

interface Props {
    playlist?: Playlist;
    onClose: (newPlaylist?: Playlist) => Promise<void>;
}

const PlaylistForm = ({ playlist, onClose }: Props) => {
    const nameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const categoryRef = useRef<HTMLInputElement>(null);
    const coverImgUrlRef = useRef<HTMLInputElement>(null);
    const tinyCoverImgUrlRef = useRef<HTMLInputElement>(null);
    const releaseDateRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (playlist) {
            nameRef.current!.value = playlist.name;
            descriptionRef.current!.value = playlist.description;
            categoryRef.current!.value = playlist.category || '';
            coverImgUrlRef.current!.value = playlist.coverImgUrl || '';
            tinyCoverImgUrlRef.current!.value = playlist.tinyCoverImgUrl || '';
            releaseDateRef.current!.value = formDate(playlist.releaseDate);
        }
    }, [playlist]);

    const handleSubmit = async () => {
        if (!nameRef.current!.value) return alert('请输入标题');
        const props = {
            name: nameRef.current!.value,
            description: descriptionRef.current!.value,
            category: categoryRef.current!.value || null,
            coverImgUrl: coverImgUrlRef.current!.value || null,
            tinyCoverImgUrl: tinyCoverImgUrlRef.current!.value || null,
            releaseDate: releaseDateRef.current!.value
                ? time(releaseDateRef.current!.value)
                : null,
        };
        try {
            let newPlaylist: Playlist;
            if (playlist) {
                newPlaylist = await clientFetch(
                    API.playlist.updatePlaylist(playlist.id, props),
                );
            } else {
                newPlaylist = await clientFetch(
                    API.playlist.createPlaylist(props),
                );
            }
            await onClose(newPlaylist);
        } catch (error: any) {
            Logger.error('播放列表更新失败', error);
            alert(error.message);
        }
    };

    return createPortal(
        <div className={styles.container}>
            <div
                className={styles.form}
                style={{ ['--field-label-width' as string]: '8em' }}
            >
                <h2>{playlist ? '编辑播放列表' : '新建播放列表'}</h2>
                <div className={clsx(styles.formItem)}>
                    <label>
                        <span>*</span>标题：
                    </label>
                    <Input raf={nameRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>描述：</label>
                    <TextArea raf={descriptionRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>分类：</label>
                    <Input raf={categoryRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>封面图 URL：</label>
                    <Input raf={coverImgUrlRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>小封面图 URL：</label>
                    <Input raf={tinyCoverImgUrlRef} />
                </div>
                <div className={clsx(styles.formItem)}>
                    <label>发布日期：</label>
                    <Input raf={releaseDateRef} type="date" />
                </div>
                <div className={styles.formItem}>
                    <label></label>
                    <div className={styles.options}>
                        <Button type="primary" onClick={handleSubmit}>
                            {playlist ? '保 存' : '创 建'}
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

export default PlaylistForm;
