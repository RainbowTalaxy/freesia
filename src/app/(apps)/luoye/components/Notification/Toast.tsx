'use client';
import styles from '../../styles/notification.module.css';
import { ReactNode } from 'react';
import Notification from './Notification';

const Toast = {
    name: 'toast',
    preMessage: null as ReactNode | null,

    notify(message: ReactNode, duration: number | false = 2000) {
        Notification.notify(
            typeof message === 'string' ? (
                <div className={styles.toastText}>{message}</div>
            ) : (
                message
            ),
            duration,
            {
                name: Toast.name,
            },
        );
        if (duration === false) {
            Toast.preMessage = message;
        }
    },

    cover(message: ReactNode, duration: number = 2000) {
        Notification.notify(
            typeof message === 'string' ? (
                <div className={styles.toastText}>{message}</div>
            ) : (
                message
            ),
            duration,
            {
                name: Toast.name,
                onEnd: () => {
                    Toast.notify(this.preMessage, false);
                },
            },
        );
    },

    close() {
        Notification.close(this.name);
    },
};

export default Toast;
