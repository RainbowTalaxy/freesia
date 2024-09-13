import clsx from 'clsx';
import styles from './style.module.css';

interface Props {
    className?: string;
    url?: string | null;
    onClick: () => void;
}

const Cover = ({ className, url, onClick }: Props) => {
    return (
        <div className={clsx(styles.container, className)} onClick={onClick}>
            {url && <img referrerPolicy="no-referrer" loading="lazy" src={url} alt="cover" />}
        </div>
    );
};

export default Cover;
