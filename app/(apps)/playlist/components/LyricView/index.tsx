import clsx from 'clsx';
import usePlayerStore from '../../contexts/usePlayerStore';
import styles from './style.module.css';
import { Lyric } from '../../data/song/[songId]/containers/LyricEditor/types';
import { useEffect } from 'react';
import { Logger } from '@/utils';
import Animation from './animation';

interface Props {
    className?: string;
}

const LyricView = ({ className }: Props) => {
    const audio = usePlayerStore((state) => state.audio);
    const song = usePlayerStore((state) => state.song);
    const getTime = usePlayerStore((state) => state.getTime);
    const seek = usePlayerStore((state) => state.seek);
    const play = usePlayerStore((state) => state.play);

    const lyric = song?.lyrics[0] as Lyric | null | undefined;

    useEffect(() => {
        if (!lyric) return;
        Animation.init(lyric, getTime());
        const handlePlay = () => Animation.start(getTime);
        const handleSeek = () => Animation.seek(getTime());
        const handlePause = () => Animation.pause();
        audio?.addEventListener('playing', handlePlay);
        audio?.addEventListener('seeked', handleSeek);
        audio?.addEventListener('pause', handlePause);
        return () => {
            audio?.removeEventListener('playing', handlePlay);
            audio?.removeEventListener('seeked', handleSeek);
            audio?.removeEventListener('pause', handlePause);
            Animation.destroy();
        };
    }, [lyric, audio, getTime]);

    if (!lyric) return null;

    return (
        <div className={clsx(styles.container, 'lyric-scroll', className)}>
            <article className={styles.article}>
                {lyric.data.map((line, lineIdx) => (
                    <p
                        key={lineIdx}
                        className={clsx(styles.line, `lyric-${lineIdx}`)}
                        onClick={() => {
                            const time = line.main[0].offset;
                            if (time !== null) {
                                seek(time);
                                play();
                            }
                        }}
                    >
                        {line.main.map((word, wordIdx) => {
                            return (
                                <span key={wordIdx} className={clsx(styles.word, `lyric-${lineIdx}-${wordIdx}`)}>
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
