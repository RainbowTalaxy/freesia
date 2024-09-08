import clsx from 'clsx';
import styles from './style.module.css';
import usePlayerStore from '../../contexts/usePlayerStore';
import { PointerEvent, useRef } from 'react';

const Svg = {
    lowestVolume: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10.802 16" aria-hidden="true">
            <path d="M9.781 16c.598 0 1.021-.43 1.021-1.023V1.07c0-.583-.422-1.07-1.04-1.07-.424 0-.71.185-1.179.624L4.725 4.253a.332.332 0 0 1-.228.089H1.899C.669 4.342 0 5.012 0 6.327v3.375c0 1.305.67 1.984 1.899 1.984h2.598a.33.33 0 0 1 .228.08l3.858 3.666c.422.393.772.568 1.198.568z"></path>
        </svg>
    ),
    highestVolume: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.239 16" aria-hidden="true">
            <path d="M8.933 15.316c.538 0 .932-.392.932-.934v-12.7c0-.533-.394-.978-.95-.978-.387 0-.656.169-1.076.57L4.306 4.588a.281.281 0 0 1-.2.081H1.735C.611 4.669 0 5.28 0 6.482v3.082c0 1.192.611 1.812 1.734 1.812h2.373c.08 0 .15.024.2.074l3.532 3.347c.385.359.707.519 1.094.519zm3.88-3.782c.282.186.668.13.892-.192.634-.84 1.019-2.07 1.019-3.34 0-1.272-.385-2.493-1.02-3.342-.223-.322-.61-.378-.89-.183-.331.232-.388.639-.13.983.486.658.75 1.576.75 2.541 0 .965-.273 1.874-.75 2.541-.249.354-.201.75.13.992zm3.08 2.155c.308.204.686.14.91-.183 1.059-1.452 1.686-3.462 1.686-5.505 0-2.042-.618-4.07-1.686-5.505-.224-.323-.602-.387-.91-.183-.305.206-.36.593-.117.937.911 1.278 1.425 2.988 1.425 4.751 0 1.763-.531 3.464-1.425 4.75-.234.345-.188.732.118.938zm3.108 2.194c.29.213.696.13.916-.204 1.453-2.095 2.322-4.752 2.322-7.678s-.895-5.574-2.322-7.678C19.697-.02 19.29-.093 19 .12c-.305.213-.352.603-.122.948 1.28 1.892 2.09 4.277 2.09 6.934 0 2.649-.81 5.052-2.09 6.934-.23.345-.183.735.122.948z"></path>
        </svg>
    ),
};

interface Props {
    className?: string;
}

const VolumeControl = ({ className }: Props) => {
    const volume = usePlayerStore((state) => state.volume); // 0 - 1
    const setVolume = usePlayerStore((state) => state.setVolume);
    const touchInfo = useRef({
        ongoing: false,
        startX: 0,
        prevProgress: 0, // 0 - 100
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const controlElementRef = useRef<HTMLDivElement>(null);

    const progress = volume * 100;

    const handlePointerDown = (e: PointerEvent) => {
        touchInfo.current.ongoing = true;
        containerRef.current?.classList.add(styles.active);
        touchInfo.current.startX = e.clientX;
        touchInfo.current.prevProgress = progress;
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!touchInfo.current.ongoing) return;
        const offset = e.clientX - touchInfo.current.startX;
        const controlWidth = controlElementRef.current?.clientWidth ?? Infinity;
        const newProgress = Math.min(Math.max(0, touchInfo.current.prevProgress + (offset * 100) / controlWidth), 100);
        setVolume(newProgress / 100);
    };

    const handlePointerOut = () => {
        if (!touchInfo.current.ongoing) return;
        touchInfo.current.ongoing = false;
        containerRef.current?.classList.remove(styles.active);
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
                <div className={styles.progressSideIcon}>{Svg.lowestVolume()}</div>
                <div ref={controlElementRef} className={styles.control}>
                    <div className={styles.progress} />
                </div>
                <div className={styles.progressSideIcon}>{Svg.highestVolume()}</div>
            </div>
        </div>
    );
};

export default VolumeControl;
