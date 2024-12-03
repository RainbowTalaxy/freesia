import clsx from 'clsx';
import { CSSProperties, ReactNode } from 'react';

interface Props {
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
    type?: 'primary' | 'danger';
    onClick?: () => void;
}

const Button = ({ className, children, style, type, onClick }: Props) => {
    return (
        <button
            className={clsx('btn', type, className)}
            style={style}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
