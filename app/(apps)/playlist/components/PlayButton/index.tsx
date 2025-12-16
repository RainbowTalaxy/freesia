import clsx from 'clsx';
import styles from './style.module.css';
import usePlayerStore from '../../contexts/usePlayerStore';
import { ReactNode, useRef } from 'react';

const Svg = {
    play: () => (
        <svg viewBox="0 0 32 28" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M10.345 23.287c.415 0 .763-.15 1.22-.407l12.742-7.404c.838-.481 1.178-.855 1.178-1.46 0-.599-.34-.972-1.178-1.462L11.565 5.158c-.457-.265-.805-.407-1.22-.407-.789 0-1.345.606-1.345 1.57V21.71c0 .971.556 1.577 1.345 1.577z"
                fillRule="nonzero"
            ></path>
        </svg>
    ),
    pause: () => (
        <svg viewBox="0 0 32 28" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M13.293 22.772c.955 0 1.436-.481 1.436-1.436V6.677c0-.98-.481-1.427-1.436-1.427h-2.457c-.954 0-1.436.473-1.436 1.427v14.66c-.008.954.473 1.435 1.436 1.435h2.457zm7.87 0c.954 0 1.427-.481 1.427-1.436V6.677c0-.98-.473-1.427-1.428-1.427h-2.465c-.955 0-1.428.473-1.428 1.427v14.66c0 .954.473 1.435 1.428 1.435h2.465z"
                fillRule="nonzero"
            ></path>
        </svg>
    ),
};

interface IconProps {
    className?: string;
    onClick?: () => void;
    children: ReactNode;
}

const Icon = ({ className, onClick, children }: IconProps) => {
    return (
        <span className={clsx(styles.icon, className)} onClick={onClick}>
            {children}
        </span>
    );
};

interface Props {
    className?: string;
}

const PlayButton = ({ className }: Props) => {
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const play = usePlayerStore((state) => state.play);
    const pause = usePlayerStore((state) => state.pause);
    const containerRef = useRef<HTMLButtonElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = () => {
        containerRef.current?.classList.add(styles.active);
        indicatorRef.current?.classList.add(styles.active);
    };

    const handlePointerUp = () => {
        containerRef.current?.classList.remove(styles.active);
        indicatorRef.current?.classList.remove(styles.active);
    };

    return (
        <button
            ref={containerRef}
            className={clsx(styles.container, className)}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            <div ref={indicatorRef} className={clsx(styles.indicator)} />
            <Icon className={clsx(isPlaying && styles.hidden)} onClick={play}>
                {Svg.play()}
            </Icon>
            <Icon className={clsx(!isPlaying && styles.hidden)} onClick={pause}>
                {Svg.pause()}
            </Icon>
        </button>
    );
};

export default PlayButton;
