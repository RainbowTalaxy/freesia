import clsx from 'clsx';
import styles from './style.module.css';

interface Props {
    className?: string;
    url?: string | null;
}

const Cover = ({ className, url }: Props) => {
    return (
        <div className={clsx(styles.container, className)}>
            {url && <img referrerPolicy="no-referrer" loading="lazy" src={url} alt="cover" />}
        </div>
    );
};

export default Cover;
