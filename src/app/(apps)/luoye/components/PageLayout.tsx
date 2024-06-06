'use client';
import styles from '../styles/layout.module.css';
import clsx from 'clsx';
import { CSSProperties, ForwardedRef, ReactNode, forwardRef } from 'react';
import { DraggableProvidedDragHandleProps, DraggableProvidedDraggableProps } from '@hello-pangea/dnd';
import Link from 'next/link';

interface ListProps {
    className?: string;
    children?: ReactNode;
}

export const SideBarList = forwardRef(({ className, children }: ListProps, ref: ForwardedRef<HTMLUListElement>) => {
    return (
        <ul ref={ref} className={clsx(styles.sidebarList, className)}>
            {children}
        </ul>
    );
});

interface ListItemProps {
    className?: string;
    /** 项目名，debug 用 */
    name?: string;
    active?: boolean;
    icon?: ReactNode;
    children?: ReactNode;
    href?: string;
    onClick?: () => void;
    draggableProps?: DraggableProvidedDraggableProps;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export const SideBarListItem = forwardRef(
    (
        { className, active, icon, children, href, onClick, dragHandleProps, draggableProps }: ListItemProps,
        ref: ForwardedRef<HTMLLIElement>,
    ) => {
        if (href === undefined) {
            return (
                <li
                    ref={ref}
                    className={clsx(styles.sidebarListItem, active && styles.active, className)}
                    onClick={onClick}
                    {...dragHandleProps}
                    {...draggableProps}
                >
                    {icon && <span className={styles.sidebarListItemIcon}>{icon}</span>}
                    {children}
                </li>
            );
        }

        return (
            <li
                ref={ref}
                className={clsx(styles.sidebarListItemWrapper, active && styles.active, className)}
                onClick={onClick}
                {...dragHandleProps}
                {...draggableProps}
            >
                {onClick ? (
                    <a className={styles.sidebarListItem} href={href} onClick={(e) => e.preventDefault()}>
                        {icon && <span className={styles.sidebarListItemIcon}>{icon}</span>}
                        {children}
                    </a>
                ) : (
                    <Link className={styles.sidebarListItem} href={href} prefetch={false}>
                        {icon && <span className={styles.sidebarListItemIcon}>{icon}</span>}
                        {children}
                    </Link>
                )}
            </li>
        );
    },
);

const SIDE_BAR_ID = 'sidebar';
const REVEAL_CLASS = 'unfold-sidebar';

interface SideBarProps {
    className?: string;
    sidebar: ReactNode;
    navbar?: ReactNode;
    children?: ReactNode;
    sidebarVisible?: boolean;
}

export const revealSidebar = () => {
    const sidebar = document.querySelector<HTMLDivElement>(`#${SIDE_BAR_ID}`);
    sidebar?.classList.add(REVEAL_CLASS);
};

export const hideSidebar = () => {
    const sidebar = document.querySelector<HTMLDivElement>(`#${SIDE_BAR_ID}`);
    sidebar?.classList.remove(REVEAL_CLASS);
};

const PageLayout = ({ className, sidebar, navbar, children, sidebarVisible = true }: SideBarProps) => {
    return (
        <div id={SIDE_BAR_ID} className={clsx(styles.pageView, !sidebarVisible && styles.noSidebar, className)}>
            {sidebarVisible && (
                <>
                    <nav className={styles.sidebar}>{sidebar}</nav>
                    <div className={styles.sidebarMask} onClick={hideSidebar} />
                </>
            )}
            <div className={clsx(styles.contentView, navbar && styles.showNav)}>
                {navbar && <nav className={styles.navbar}>{navbar}</nav>}
                <div className={styles.content}>{children}</div>
            </div>
        </div>
    );
};

export default PageLayout;
