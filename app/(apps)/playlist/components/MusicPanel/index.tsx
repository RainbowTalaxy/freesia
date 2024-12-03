'use client';
import styles from './style.module.css';
import usePlayerStore from '../../contexts/usePlayerStore';
import { useEffect, useRef, useState } from 'react';
import Animation from './animation';
import LyricToggle from '../LyricToggle';
import DurationControl from '../control/DurationControl';
import { Next, Previous } from '../player';
import VolumeControl from '../control/VolumeControl';
import LyricView from '../LyricView';
import PlayButton from '../PlayButton';

const MusicPanel = () => {
    const song = usePlayerStore((state) => state.song);
    const [lyricOn, setLyricOn] = useState(true);
    const isPositioned = useRef(false);

    useEffect(() => {
        const handleResize = () => Animation.initPosition(lyricOn);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isPositioned.current) {
            return Animation.transition(lyricOn);
        }
        isPositioned.current = true;
        Animation.initPosition(lyricOn);
    }, [lyricOn]);

    return (
        <div
            className={styles.panel}
            style={{
                backgroundColor: (song?.theme as string) ?? 'black',
            }}
        >
            {/* 封面 */}
            <img
                className={styles.cover}
                referrerPolicy="no-referrer"
                loading="lazy"
                src={song?.albumImgUrl ?? ''}
                alt="cover"
            ></img>
            {/* 信息条 */}
            <div className={styles.info}>
                <div className={styles.detail}>
                    <span className={styles.songName}>{song?.name}</span>
                    <span className={styles.artist}>{song?.artist}</span>
                </div>
                <LyricToggle value={lyricOn} onClick={setLyricOn} />
            </div>
            {/* 歌词 */}
            <div className={styles.content}>
                <LyricView />
            </div>
            {/* 控制中心 */}
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
            </div>
        </div>
    );
};

export default MusicPanel;
