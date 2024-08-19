import clsx from 'clsx';
import style from './style.module.css';

interface Props {
    className?: string;
    url?: string | null;
    size?: number;
    shadow?: boolean;
}

const Cover = ({ className, url, size = 200, shadow = false }: Props) => {
    return (
        <div
            className={clsx(style.cover, shadow && style.shadow, className)}
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
