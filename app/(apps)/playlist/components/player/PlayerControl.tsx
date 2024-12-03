'use client';
import clsx from 'clsx';
import styles from './style.module.css';
import usePlayerStore from '../../contexts/usePlayerStore';
import Cover from '../../data/components/Cover';
import PlayButton from './PlayButton';
import Previous from './Previous';
import Next from './Next';
import Shuffle from './Shuffle';
import ModeSwitch from './ModeSwitch';

interface Props {
    className?: string;
}

const PlayerControl = ({ className }: Props) => {
    const song = usePlayerStore((state) => state.song);

    if (!song) return null;

    return (
        <div className={clsx(styles.container, className)}>
            <Cover url={song.tinyAlbumImgUrl} size={48} />
            <div className={styles.songInfo}>
                <span className={styles.songName}>{song.name}</span>
                <span className={styles.artist}>{song.artist}</span>
            </div>
            <div className={styles.buttonGroup}>
                <Shuffle />
                <Previous />
                <PlayButton />
                <Next />
                <ModeSwitch />
            </div>
        </div>
    );
};

export default PlayerControl;
