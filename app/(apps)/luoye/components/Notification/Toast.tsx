'use client';
import { ReactNode } from 'react';
import Notification from './Notification';
import styles from './index.module.css';

const Toast = {
    name: 'toast',
    preMessage: null as ReactNode | null,

    notify(message: ReactNode, duration: number | false = 2000) {
        Notification.notify(
            typeof message === 'string' ? <div className={styles.toastText}>{message}</div> : message,
            duration,
        );
        if (duration === false) {
            Toast.preMessage = message;
        }
    },

    cover(message: ReactNode, duration: number = 2000) {
        Notification.notify(
            typeof message === 'string' ? <div className={styles.toastText}>{message}</div> : message,
            duration,
            {
                onEnd: () => {
                    Toast.notify(this.preMessage, false);
                },
            },
        );
    },

    close() {
        Notification.close();
    },
};

export default Toast;
