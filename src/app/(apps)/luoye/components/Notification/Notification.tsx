'use client';
import styles from './index.module.css';
import { ReactNode } from 'react';
import { Root, createRoot } from 'react-dom/client';

export const NOTIFICATION_CONTAINER_CLASS = 'notification-container';

export interface NotificationOption {
    text?: ReactNode;
    onEnd?: (() => void) | null;
}

class Notification {
    private static type: string | null = null;
    private static timerId: ReturnType<typeof setTimeout> | null = null;
    private static _container: HTMLDivElement | null = null;
    private static root: Root | null = null;

    private static get container() {
        if (this._container) return this._container;
        let container = document.querySelector<HTMLDivElement>(`.${NOTIFICATION_CONTAINER_CLASS}`)! as HTMLDivElement;
        if (!container) {
            container = document.createElement('div');
            container.classList.add(NOTIFICATION_CONTAINER_CLASS);
            container.classList.add(styles.container);
            document.body.appendChild(container);
        }
        container.classList.add(styles.container);
        this._container = container;
        return container;
    }

    static close(name: string) {
        if (name !== this.type) return;
        this.container.style.transform = '';
        setTimeout(() => {
            this.reset();
        }, 550);
    }

    static reset() {
        if (this.timerId) clearTimeout(this.timerId);
        this.timerId = null;
        this.type = null;
    }

    static notify(message: ReactNode, duration: number | false = 2000, options: NotificationOption & { name: string }) {
        this.reset();
        if (!this.root) this.root = createRoot(this.container);
        this.root.render(<>{message}</>);
        this.container.style.transform = 'translateY(0)';
        this.type = options.name;
        if (duration) {
            this.timerId = setTimeout(() => {
                if (options.onEnd) {
                    options.onEnd();
                } else {
                    this.close(options.name);
                }
            }, duration);
        }
    }
}

export default Notification;
