'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import API, { clientFetch } from '@/api';
import { Button, Input } from '@/components/form';
import { Logger } from '@/utils';
import styles from '../../../styles/form.module.css';
import { Resource, Song } from '@/api/playlist';

interface Props {
    songId: string;
    resource?: Resource;
    onClose: (newSong?: Song) => Promise<void>;
}

const ResourceForm = ({ songId, resource, onClose }: Props) => {
    const labelRef = useRef<HTMLInputElement>(null);
    const pathRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (resource) {
            pathRef.current!.value = resource.path;
        }
    }, [resource]);

    const handleSubmit = async () => {
        if (labelRef.current && !labelRef.current!.value)
            return alert('请输入标题');
        if (!pathRef.current!.value) return alert('请输入路径');
        try {
            let newSong: Song;
            if (resource) {
                newSong = await clientFetch(
                    API.playlist.updateResourceOfSong(
                        songId,
                        resource.label,
                        pathRef.current!.value,
                    ),
                );
            } else {
                newSong = await clientFetch(
                    API.playlist.addResourceToSong(songId, {
                        label: labelRef.current!.value,
                        path: pathRef.current!.value,
                    }),
                );
            }
            await onClose(newSong);
        } catch (error: any) {
            Logger.error('资源信息更新失败', error);
            alert(error.message);
        }
    };

    return createPortal(
        <div className={styles.container}>
            <div
                className={styles.form}
                style={{ ['--field-label-width' as string]: '8em' }}
            >
                <h2>{resource ? '修改资源' : '添加资源'}</h2>
                {!resource && (
                    <div className={clsx(styles.formItem)}>
                        <label>
                            <span>*</span>标签：
                        </label>
                        <Input raf={labelRef} />
                    </div>
                )}
                <div className={clsx(styles.formItem)}>
                    <label>
                        <span>*</span>路径：
                    </label>
                    <Input raf={pathRef} />
                </div>
                <div className={styles.formItem}>
                    <label></label>
                    <div className={styles.options}>
                        <Button type="primary" onClick={handleSubmit}>
                            {resource ? '保 存' : '添 加'}
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

export default ResourceForm;
