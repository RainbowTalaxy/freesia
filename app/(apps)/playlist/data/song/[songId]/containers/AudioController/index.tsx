'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './style.module.css';
import { create } from 'zustand';

type AudioUpdateType = 'auto' | 'manual';

const defaultState = {
    ref: null as HTMLAudioElement | null,
    time: 0,
    playing: false,
    updateType: 'auto' as AudioUpdateType,
    seek: (time: number) => {},
    getTime: () => 0,
};

export const useAudioStore = create<{
    ref: HTMLAudioElement | null;
    time: number;
    playing: boolean;
    updateType: AudioUpdateType;
    seek: (time: number) => void;
    getTime: () => number;
}>()(() => defaultState);

const Time = () => {
    const [time, setTime] = useState(0);
    const getTime = useAudioStore((state) => state.getTime);

    useEffect(() => {
        const update = () => {
            setTime(getTime());
            requestAnimationFrame(update);
        };
        update();
    }, [getTime]);

    return <span className={styles.time}>时间（ms）：{Math.round(time)}</span>;
};
const ProgressButton = ({ offset }: { offset: number }) => {
    const ref = useAudioStore((state) => state.ref);
    const seek = useAudioStore((state) => state.seek);
    const getTime = useAudioStore((state) => state.getTime);

    return (
        <button
            className={styles.action}
            onClick={() => {
                if (!ref) return;
                seek(getTime() + offset * 1000);
            }}
        >
            {offset > 0 && '+'}
            {offset}s
        </button>
    );
};

interface Props {
    src: string;
}

const AudioController = ({ src }: Props) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const nextUpdateType = useRef<'manual' | 'auto'>('auto');

    useEffect(() => {
        useAudioStore.setState({
            ref: audioRef.current,
            seek: (time) => {
                const ref = audioRef.current;
                if (!ref) return;
                ref.currentTime = time / 1000;
                nextUpdateType.current = 'manual';
            },
            getTime: () => {
                const ref = audioRef.current;
                return ref ? Math.round(ref.currentTime * 1000) : 0;
            },
        });
        return () => {
            useAudioStore.setState(defaultState);
        };
    }, []);

    return (
        <>
            <header className={styles.header}>音频控制</header>
            <div className={styles.container}>
                <audio
                    ref={audioRef}
                    className={styles.audio}
                    src={src}
                    controls
                    onPause={() =>
                        useAudioStore.setState({
                            playing: false,
                        })
                    }
                    onPlay={() =>
                        useAudioStore.setState({
                            playing: true,
                        })
                    }
                    onTimeUpdate={(e) => {
                        useAudioStore.setState({
                            time: Math.round((e.target as HTMLAudioElement).currentTime * 1000),
                            updateType: nextUpdateType.current,
                        });
                        nextUpdateType.current = 'auto';
                    }}
                />
                <div className={styles.controller}>
                    <Time />
                    <ProgressButton offset={-10} />
                    <ProgressButton offset={-5} />
                    <ProgressButton offset={5} />
                    <ProgressButton offset={10} />
                    <button
                        className={styles.action}
                        onClick={() => {
                            if (!audioRef.current) return;
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                        }}
                    >
                        重 置
                    </button>
                </div>
            </div>
        </>
    );
};

export default AudioController;
