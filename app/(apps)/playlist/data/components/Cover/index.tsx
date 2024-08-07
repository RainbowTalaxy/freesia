import clsx from 'clsx';
import style from './Cover.module.css';

interface Props {
    className?: string;
    url?: string | null;
    size?: number;
}

const Cover = ({ className, url, size = 200 }: Props) => {
    return (
        <div
            className={clsx(style.cover, className)}
            style={{ ['--cover-length' as string]: size + 'px' }}
        >
            {url && (
                <img
                    src={url}
                    alt="cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                />
            )}
        </div>
    );
};

export default Cover;
