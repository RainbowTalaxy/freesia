'use client';
import clsx from 'clsx';
import SVG from '../SVG';
import styles from './index.module.css';

interface Props {
    loading?: boolean;
    onClick?: () => void;
    className?: string;
}

const AITagButton = ({ loading, onClick, className }: Props) => {
    return (
        <button type="button" className={clsx(styles.button, className)} onClick={onClick} disabled={loading}>
            {loading ? (
                <>
                    <span className={styles.spinner}>
                        <SVG.Loader />
                    </span>
                    <span>生成中</span>
                </>
            ) : (
                'AI 生成标签'
            )}
        </button>
    );
};

export default AITagButton;
export { styles as aiStyles };
