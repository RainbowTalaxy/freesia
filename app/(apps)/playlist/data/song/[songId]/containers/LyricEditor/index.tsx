/**
 * 步骤：
 *
 * 1. 输入歌词，并选择分词方式，创建初始歌词数据
 * 2. 句子打点
 * 3. 词打点
 */
'use client';
import styles from './style.module.css';
import { Song } from '@/api/playlist';
import Initializer from './Initializer';
import Modifier from './Modifier';
import { useEffect } from 'react';
import useLyricStore from './useLyricStore';
import { Lyric } from './types';

interface Props {
    song: Song;
}

const LyricEditor = ({ song }: Props) => {
    useEffect(() => {
        const lyric = song.lyrics[0] as Lyric;
        if (!lyric) return;
        const { initialize, clear } = useLyricStore.getState();
        initialize(lyric);
        return () => clear();
    }, [song]);

    return (
        <>
            <header className={styles.header}>歌词编辑</header>
            <div className={styles.container}>
                {song.lyrics.length === 0 ? <Initializer song={song} /> : <Modifier song={song} />}
            </div>
        </>
    );
};

export default LyricEditor;
