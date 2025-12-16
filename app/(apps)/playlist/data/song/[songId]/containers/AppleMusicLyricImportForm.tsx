'use client';
import { useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import API, { clientFetch } from '@/api';
import { Button, TextArea } from '@/components/form';
import { Logger } from '@/utils';
import styles from '../../../styles/form.module.css';
import { Song } from '@/api/playlist';
import { parseAppleMusicLyric } from '@/(apps)/playlist/utils/apple-music';

interface Props {
    songId: string;
    onClose: (newSong?: Song) => void | Promise<void>;
}

const AppleMusicLyricImportForm = ({ songId, onClose }: Props) => {
    const dataRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async () => {
        const granted = confirm('确定要上传歌词吗（将替代原有歌词）？');
        try {
            const data = parseAppleMusicLyric(dataRef.current!.value);
            const newSong = await clientFetch(
                API.playlist.updateAttributesOfSong(songId, {
                    lyrics: [data],
                }),
            );
            await onClose(newSong);
        } catch (error: any) {
            Logger.error('歌词上传失败', error);
            alert(error.message);
        }
    };

    return createPortal(
        <div className={styles.container}>
            <div className={styles.form} style={{ ['--field-label-width' as string]: '8em' }}>
                <h2>导入苹果音乐歌词</h2>
                <div className={clsx(styles.formItem)}>
                    <label>
                        <span>*</span>数据：
                    </label>
                    <TextArea raf={dataRef} />
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

export default AppleMusicLyricImportForm;
