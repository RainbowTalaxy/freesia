import clsx from 'clsx';
import { CSSProperties, ReactNode } from 'react';

interface Props {
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
    type?: 'primary' | 'danger';
    buttonType?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    onClick?: () => void;
}

const Button = ({
    className,
    children,
    style,
    type,
    buttonType,
    disabled,
    onClick,
}: Props) => {
    return (
        <button
            className={clsx('btn', type, className)}
            style={style}
            type={buttonType}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
