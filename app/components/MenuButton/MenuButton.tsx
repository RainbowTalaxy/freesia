'use client';

import clsx from 'clsx';
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import './index.css';

export type MenuPosition =
    | 'bottom-left'
    | 'bottom-right'
    | 'top-left'
    | 'top-right';

export interface MenuItemData {
    label: string;
    onClick?: () => void;
}

interface Props {
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
    items: MenuItemData[];
    type?: 'primary' | 'danger';
    buttonType?: 'button' | 'submit' | 'reset';
    minWidth?: number;
    maxWidth?: number;
    position?: MenuPosition;
}

const MenuButton = ({
    className,
    children,
    items,
    style,
    type,
    buttonType,
    minWidth,
    maxWidth,
    position = 'bottom-left',
}: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleItemClick = () => {
        setIsOpen(false);
    };

    const menuStyle: CSSProperties = {
        minWidth: minWidth ? `${minWidth}px` : undefined,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
    };

    return (
        <div className="menu-btn" ref={containerRef}>
            <button
                className={clsx('btn', type, className)}
                style={style}
                type={buttonType}
                onClick={handleToggle}
            >
                {children}
            </button>
            {isOpen && (
                <div
                    className={clsx('menu-btn-dropdown', position)}
                    style={menuStyle}
                >
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className="menu-btn-item"
                            onClick={() => {
                                item.onClick?.();
                                handleItemClick();
                            }}
                        >
                            {item.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MenuButton;
