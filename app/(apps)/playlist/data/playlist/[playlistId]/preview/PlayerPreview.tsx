'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import usePlayerStore from '../../../../contexts/usePlayerStore';
import Cover from '../../../../components/Cover';
import { Previous, Next, PlayButton } from '../../../../components/player';
import styles from './style.module.css';
import { Playlist } from '@/api/playlist';

interface Props {
    playlist: Playlist;
}

const ScrollTitle = ({ text, className }: { text: string; className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shouldScroll, setShouldScroll] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        const checkScroll = () => {
            if (containerRef.current && textRef.current) {
                const contentWidth = textRef.current.offsetWidth;
                const containerWidth = containerRef.current.clientWidth;
                if (contentWidth > containerWidth) {
                    setShouldScroll(true);
                    const scrollWidth = contentWidth + 32;
                    const duration = scrollWidth / 30; // 30px/s speed
                    containerRef.current.style.setProperty('--scroll-width', `${scrollWidth}px`);
                    containerRef.current.style.setProperty('--duration', `${duration}s`);
                } else {
                    setShouldScroll(false);
                    setIsScrolling(false);
                    containerRef.current.style.removeProperty('--scroll-width');
                    containerRef.current.style.removeProperty('--duration');
                }
            }
        };

        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [text]);

    useEffect(() => {
        if (!shouldScroll) return;

        let timeoutId: NodeJS.Timeout;

        const startScroll = () => {
            setIsScrolling(true);
        };

        // Initial delay
        timeoutId = setTimeout(startScroll, 3000);

        return () => clearTimeout(timeoutId);
    }, [shouldScroll, text]);

    const handleAnimationEnd = () => {
        setIsScrolling(false);
        // Wait 3s before scrolling again
        setTimeout(() => {
            setIsScrolling(true);
        }, 3000);
    };

    return (
        <div className={styles.scrollOuter}>
            <div
                ref={containerRef}
                className={clsx(styles.scrollContainer, isScrolling && styles.scrolling, className)}
            >
                <div
                    className={clsx(styles.scrollWrapper, isScrolling && styles.scrolling)}
                    onAnimationEnd={handleAnimationEnd}
                >
                    <span ref={textRef}>{text}</span>
                    {shouldScroll && <span>{text}</span>}
                </div>
            </div>
        </div>
    );
};

export default function PlayerPreview({ playlist }: Props) {
    const song = usePlayerStore((state) => state.song);
    const duration = usePlayerStore((state) => state.duration);
    const getTime = usePlayerStore((state) => state.getTime);
    const seek = usePlayerStore((state) => state.seek);
    const isPlaying = usePlayerStore((state) => state.isPlaying);

    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>();

    // Initialize playlist
    useEffect(() => {
        usePlayerStore.getState().setPlaylist(playlist);
    }, [playlist]);

    useEffect(() => {
        const updateProgress = () => {
            if (!isDragging && duration > 0 && duration !== Infinity) {
                const currentTime = getTime();
                setProgress((currentTime / duration) * 100);
            }
            rafRef.current = requestAnimationFrame(updateProgress);
        };

        rafRef.current = requestAnimationFrame(updateProgress);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [duration, getTime, isDragging]);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressRef.current || duration === Infinity) return;
        const rect = progressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        seek(percentage * duration);
        setProgress(percentage * 100);
    };

    // Use the current song from store, or fallback to the first song in playlist for display if not playing yet
    const displaySong = song || (playlist.songs.length > 0 ? playlist.songs[0] : null);

    if (!displaySong) {
        return (
            <div className={styles.container}>
                <div className={styles.player}>
                    <div className={styles.info}>No songs in playlist</div>
                </div>
            </div>
        );
    }

    const coverUrl = 'albumImgUrl' in displaySong ? displaySong.albumImgUrl : displaySong.tinyAlbumImgUrl;

    return (
        <div className={styles.container}>
            {coverUrl && (
                <img src={coverUrl} className={styles.background} referrerPolicy="no-referrer" loading="lazy" alt="" />
            )}
            <div className={styles.overlay} />
            <div className={styles.player}>
                <div className={styles.mainRow}>
                    <Cover className={styles.cover} url={coverUrl} onClick={() => {}} />
                    <div className={styles.info}>
                        <ScrollTitle text={displaySong.name} className={styles.titleBase} />
                        <div className={styles.artist}>{displaySong.artist}</div>
                    </div>
                    <div className={styles.controls}>
                        <Previous className={styles.controlBtn} />
                        <PlayButton className={styles.playBtn} />
                        <Next className={styles.controlBtn} />
                    </div>
                </div>
                <div className={styles.progressContainer} ref={progressRef} onClick={handleSeek}>
                    <div className={styles.progressBar} style={{ width: `${progress}%` }}>
                        <div className={styles.progressKnob} />
                    </div>
                </div>
            </div>
        </div>
    );
}
