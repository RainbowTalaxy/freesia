import clsx from 'clsx';
import { CSSProperties, ReactNode } from 'react';

interface Props {
    style?: CSSProperties;
    children: ReactNode;
    type?: 'primary' | 'danger';
    buttonType?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
}

const Button = ({ children, style, type, buttonType, onClick }: Props) => {
    return (
        <button
            className={clsx('btn', type)}
            style={style}
            type={buttonType}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
