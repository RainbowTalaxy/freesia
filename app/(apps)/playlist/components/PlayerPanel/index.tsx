'use client';
import clsx from 'clsx';
import usePlayerStore from '../../contexts/usePlayerStore';
import Cover from '../Cover';
import styles from './style.module.css';
import Previous from '../player/Previous';
import Next from '../player/Next';
import DurationControl from '../control/DurationControl';
import { useEffect, useState } from 'react';
import API, { clientFetch } from '@/api';
import VolumeControl from '../control/VolumeControl';
import PlayButton from '../PlayButton';
import LyricToggle from '../LyricToggle';

const PlayerPanel = () => {
    const song = usePlayerStore((state) => state.song);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const [lyricOn, setLyricOn] = useState(false);

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
            <div className={styles.shadow} />
            <div className={styles.handle} />
            <div className={styles.content}>
                <div className={clsx(styles.headerContainer, lyricOn && styles.active)}>
                    <Cover
                        className={clsx(styles.mainCover, isPlaying && styles.active, lyricOn && styles.move)}
                        url={song.albumImgUrl}
                        onClick={() => setLyricOn(false)}
                    />
                    <div className={clsx(styles.header, lyricOn && styles.active)}>
                        <div className={clsx(styles.songInfo, lyricOn && styles.active)}>
                            <span className={styles.songName} onClick={() => setLyricOn((p) => !p)}>
                                {song.name}
                            </span>
                            <span className={styles.artist}>{song.artist}</span>
                        </div>
                        <LyricToggle
                            className={clsx(styles.lyricToggle, lyricOn && styles.active)}
                            value={lyricOn}
                            onClick={() => setLyricOn((p) => !p)}
                        />
                    </div>
                </div>
                <div className={clsx(styles.lyric, lyricOn && styles.active)} />
                <div className={styles.controlCenter}>
                    <DurationControl className={styles.durationControl} />
                    <div className={styles.spacer} />
                    <div className={styles.mainControl}>
                        <Previous className={styles.prev} />
                        <PlayButton className={styles.playButton} />
                        <Next className={styles.next} />
                    </div>
                    <div className={styles.spacer} />
                    <VolumeControl className={styles.volumeControl} />
                    <div className={styles.spacer} />
                    <div className={styles.spacer} />
                </div>
            </div>
        </div>
    );
};

export default PlayerPanel;
