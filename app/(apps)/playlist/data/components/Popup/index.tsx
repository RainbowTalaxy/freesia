'use client';
import { ReactNode } from 'react';
import styles from './style.module.css';

interface Props {
    title: string;
    children: ReactNode;
    onClose: () => void;
    onDone: () => void;
}

const Popup = ({ title, children, onClose, onDone }: Props) => {
    return (
        <div className={styles.container}>
            <div className={styles.popup}>
                <div className={styles.titleBar}>
                    <button className={styles.closeBtn} onClick={onClose}>
                        取消
                    </button>
                    <span className={styles.title}>{title}</span>
                    <button className={styles.doneBtn} onClick={onDone}>
                        完成
                    </button>
                </div>
                <div className={styles.content}>{children}</div>
            </div>
            <div className={styles.mask} onClick={onClose} />
        </div>
    );
};

export default Popup;
