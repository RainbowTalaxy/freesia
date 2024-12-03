import clsx from 'clsx';
import style from './style.module.css';
import { ReactNode } from 'react';

interface Props {
    className?: string;
    children: ReactNode;
}

const ButtonGroup = ({ className, children }: Props) => {
    return <div className={clsx(style.buttonGroup, className)}>{children}</div>;
};

export default ButtonGroup;
