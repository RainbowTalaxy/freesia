import { ForwardedRef, ReactNode, forwardRef } from 'react';
import style from './style.module.css';
import clsx from 'clsx';
import {
    DraggableProvidedDragHandleProps,
    DraggableProvidedDraggableProps,
    DroppableProvidedProps,
} from '@hello-pangea/dnd';

interface ListItemProps {
    className?: string;
    children: ReactNode;
    onClick?: () => void;
    draggableProps?: DraggableProvidedDraggableProps;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export const ListItem = forwardRef(
    (
        {
            className,
            children,
            onClick,
            draggableProps,
            dragHandleProps,
        }: ListItemProps,
        ref: ForwardedRef<HTMLLIElement>,
    ) => {
        return (
            <li
                ref={ref}
                className={clsx(style.listItem, className)}
                onClick={onClick}
                {...draggableProps}
                {...dragHandleProps}
            >
                {children}
            </li>
        );
    },
);

interface ListProps {
    className?: string;
    header?: ReactNode;
    children?: ReactNode;
    droppableProps?: DroppableProvidedProps;
}

const List = forwardRef(
    (
        { className, children, header, droppableProps }: ListProps,
        ref: ForwardedRef<HTMLUListElement>,
    ) => {
        return (
            <>
                <header className={style.listHeader}>{header}</header>
                <ul
                    ref={ref}
                    className={clsx(style.list, className)}
                    {...droppableProps}
                >
                    {children}
                </ul>
            </>
        );
    },
);

export default List;
