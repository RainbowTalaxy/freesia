import clsx from 'clsx';
import { CSSProperties, ReactNode } from 'react';

interface Props {
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
    type?: 'primary' | 'danger';
    buttonType?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
}

const Button = ({
    className,
    children,
    style,
    type,
    buttonType,
    onClick,
}: Props) => {
    return (
        <button
            className={clsx('btn', type, className)}
            style={style}
            type={buttonType}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
