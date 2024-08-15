import { ReactNode } from 'react';
import style from './style.module.css';
import clsx from 'clsx';

interface ListItemProps {
    className?: string;
    children: ReactNode;
    onClick?: () => void;
}

export const ListItem = ({ className, children, onClick }: ListItemProps) => {
    return (
        <li className={clsx(style.listItem, className)} onClick={onClick}>
            {children}
        </li>
    );
};

interface ListProps {
    className?: string;
    header?: ReactNode;
    children?: ReactNode;
}

const List = ({ className, children, header }: ListProps) => {
    return (
        <>
            <header className={style.listHeader}>{header}</header>
            <ul className={clsx(style.list, className)}>{children}</ul>
        </>
    );
};

export default List;
