import clsx from 'clsx';
import styles from './style.module.css';
import usePlayerStore from '../../contexts/usePlayerStore';
import { PointerEvent, useEffect, useRef, useState } from 'react';
import { msToDurationNumText } from '../../utils';

interface Props {
    className?: string;
}

const DurationControl = ({ className }: Props) => {
    const [time, setTime] = useState(0);
    const audio = usePlayerStore((state) => state.audio);
    const duration = usePlayerStore((state) => state.duration);
    const seek = usePlayerStore((state) => state.seek);
    const touchInfo = useRef({
        ongoing: false,
        startX: 0,
        newProgress: 0, // 0 - 100
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const controlElementRef = useRef<HTMLDivElement>(null);
    const timeElementRef = useRef<HTMLSpanElement>(null);
    const restTimeElementRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        let mounted = true;
        const updateProgress = () => {
            if (!mounted || !audio) return;
            if (!touchInfo.current.ongoing) setTime(audio.currentTime * 1000);
            requestAnimationFrame(updateProgress);
        };
        updateProgress();
        return () => {
            mounted = false;
        };
    }, [audio]);

    const currentTimeText = msToDurationNumText(time);
    const restTimeText = msToDurationNumText(duration - time);
    const progress = (time * 100) / duration;

    const handlePointerDown = (e: PointerEvent) => {
        touchInfo.current.ongoing = true;
        containerRef.current?.classList.add(styles.active);
        touchInfo.current.startX = e.clientX;
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!touchInfo.current.ongoing) return;
        const offset = e.clientX - touchInfo.current.startX;
        const controlWidth = controlElementRef.current?.clientWidth ?? Infinity;
        const newProgress = Math.min(Math.max(0, progress + (offset * 100) / controlWidth), 100);
        containerRef.current?.style.setProperty('--progress', `${newProgress}%`);
        touchInfo.current.newProgress = newProgress;
        // 更新文本
        timeElementRef.current!.textContent = msToDurationNumText((newProgress * duration) / 100);
        restTimeElementRef.current!.textContent = '-' + msToDurationNumText(duration - (newProgress * duration) / 100);
    };

    const handlePointerOut = () => {
        if (!touchInfo.current.ongoing) return;
        touchInfo.current.ongoing = false;
        containerRef.current?.classList.remove(styles.active);
        seek((touchInfo.current.newProgress * duration) / 100 / 1000);
    };

    return (
        <div
            ref={containerRef}
            className={clsx(styles.container, className)}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerOut}
            style={{
                ['--progress' as string]: `${progress}%`,
            }}
        >
            <div className={styles.scaleArea}>
                <div ref={controlElementRef} className={styles.control}>
                    <div className={styles.progress} />
                </div>
            </div>
            <div className={styles.info}>
                <span ref={timeElementRef} className={styles.time}>
                    {currentTimeText}
                </span>
                <span ref={restTimeElementRef} className={styles.duration}>
                    -{restTimeText}
                </span>
            </div>
        </div>
    );
};

export default DurationControl;
