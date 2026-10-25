import clsx from 'clsx';
import { CSSProperties, ReactNode } from 'react';

interface Props {
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
    type?: 'primary' | 'danger';
    disabled?: boolean;
    onClick?: () => void;
}

const Button = ({ className, children, style, type, disabled, onClick }: Props) => {
    return (
        <button
            className={clsx('btn', type, className)}
            style={style}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
