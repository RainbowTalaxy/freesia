'use client';
import clsx from 'clsx';
import usePlayerStore from '../../contexts/usePlayerStore';
import Cover from '../Cover';
import styles from './style.module.css';
import Previous from '../player/Previous';
import Next from '../player/Next';
import DurationControl from '../control/DurationControl';
import { useEffect } from 'react';
import API, { clientFetch } from '@/api';
import VolumeControl from '../control/VolumeControl';
import PlayButton from '../PlayButton';

const PlayerPanel = () => {
    const song = usePlayerStore((state) => state.song);
    const isPlaying = usePlayerStore((state) => state.isPlaying);

    useEffect(() => {
        clientFetch(
            API.playlist.updateAttributesOfSong('8f99fde1-d9e9-489e-a569-a5d7aaa88cb1', {
                theme: 'rgb(30, 44, 62)',
            }),
        );
        clientFetch(
            API.playlist.updateAttributesOfSong('8966bd20-db22-4f12-91e3-0dfea70cc17c', {
                theme: '#725835',
            }),
        );
    }, []);

    if (!song) return null;

    return (
        <div
            className={styles.container}
            style={{
                backgroundColor: (song.theme as string) ?? 'black',
            }}
        >
            <div className={styles.handle} />
            <div className={styles.spacer} />
            <div className={styles.content}>
                <div className={styles.coverContainer}>
                    <Cover className={clsx(styles.mainCover, isPlaying && styles.active)} url={song.albumImgUrl} />
                </div>
                <div className={styles.header}>
                    <div className={styles.songInfo}>
                        <span className={styles.songName}>{song.name}</span>
                        <span className={styles.artist}>{song.artist}</span>
                    </div>
                </div>
                <DurationControl className={styles.durationControl} />
                <div className={styles.mainControl}>
                    <Previous className={styles.prev} />
                    <PlayButton className={styles.playButton} />
                    <Next className={styles.next} />
                </div>
                <VolumeControl className={styles.volumeControl} />
            </div>
            <div className={styles.spacer} />
        </div>
    );
};

export default PlayerPanel;
