import clsx from 'clsx';
import usePlayerStore from '../../contexts/usePlayerStore';
import styles from './style.module.css';
import { Lyric } from '../../data/song/[songId]/containers/LyricEditor/types';
import { useEffect } from 'react';
import LyricAnimation from './LyricAnimation';
import { Logger } from '@/utils';

interface Props {
    className?: string;
}

const LyricView = ({ className }: Props) => {
    const song = usePlayerStore((state) => state.song);
    const getTime = usePlayerStore((state) => state.getTime);
    const seek = usePlayerStore((state) => state.seek);

    const lyric = song?.lyrics?.[0] as Lyric;

    useEffect(() => {
        let mounted = true;
        LyricAnimation.init(lyric.data, getTime());
        const animate = () => {
            if (!mounted) return;
            LyricAnimation.seek(getTime());
            requestAnimationFrame(animate);
        };
        animate();
        return () => {
            mounted = false;
        };
    }, [lyric, getTime]);

    return (
        <div className={clsx(styles.container, 'lyric-scroll', className)}>
            <article className={styles.article}>
                {lyric.data.map((line, lineIdx) => (
                    <p
                        key={lineIdx}
                        className={clsx(styles.line, `lyric-line-${lineIdx}`)}
                        onClick={() => {
                            const time = line.main[0].offset;
                            if (time !== null) seek(time);
                        }}
                    >
                        {line.main.map((word, wordIdx) => {
                            return (
                                <span key={wordIdx} className={clsx(styles.word, `lyric-word-${lineIdx}-${wordIdx}`)}>
                                    {word.content}
                                </span>
                            );
                        })}
                    </p>
                ))}
            </article>
        </div>
    );
};

export default LyricView;
