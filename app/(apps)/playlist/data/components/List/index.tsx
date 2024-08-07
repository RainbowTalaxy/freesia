import { ReactNode } from 'react';
import style from './List.module.css';

interface ListItemProps {
    children: ReactNode;
    onClick?: () => void;
}

export const ListItem = ({ children, onClick }: ListItemProps) => {
    return (
        <li className={style.listItem} onClick={onClick}>
            {children}
        </li>
    );
};

interface ListProps {
    header?: ReactNode;
    children?: ReactNode;
}

const List = ({ children, header }: ListProps) => {
    return (
        <>
            <header className={style.listHeader}>{header}</header>
            <ul className={style.list}>{children}</ul>
        </>
    );
};

export default List;
