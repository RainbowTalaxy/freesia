'use client';
import clsx from 'clsx';
import SVG from '../SVG';
import styles from './index.module.css';

interface Props {
    children: string;
    onRemove?: () => void;
    className?: string;
}

const Tag = ({ children, onRemove, className }: Props) => {
    return (
        <span className={clsx(styles.container, className)}>
            {children}
            {onRemove && (
                <button className={styles.remove} onClick={onRemove} type="button">
                    <SVG.Close />
                </button>
            )}
        </span>
    );
};

export default Tag;
