import { ComponentType } from 'react';

export default class Logger {
    static info(icon: string, message: string) {
        console.log(`[${new Date().toLocaleString()}]`, icon, message);
    }

    static error(message: string) {
        this.info('🚫', message);
    }

    static render(componentName: string) {
        Logger.info(
            '🎨',
            `[${
                typeof window === 'undefined' ? 'Server' : 'Client'
            }] ${componentName}`,
        );
    }
}
