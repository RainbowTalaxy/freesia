import clsx from 'clsx';
import { CSSProperties, ReactNode } from 'react';

interface Props {
    style?: CSSProperties;
    children: ReactNode;
    type?: 'primary' | 'danger';
    onClick?: () => void;
}

const Button = ({ children, style, type, onClick }: Props) => {
    return (
        <button className={clsx('btn', type)} style={style} onClick={onClick}>
            {children}
        </button>
    );
};

export default Button;
