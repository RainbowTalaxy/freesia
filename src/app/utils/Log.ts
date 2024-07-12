export default class Logger {
    static info(icon: string, ...message: any[]) {
        console.log(`[${new Date().toLocaleString()}]`, icon, ...message);
    }

    static error(...message: string[]) {
        this.info('🚫', ...message);
    }

    static render(componentName: string) {
        Logger.info(
            '🎨',
            `[${
                typeof window === 'undefined' ? 'Server' : 'Client'
            }] ${componentName}`,
        );
    }

    static debug(...data: any[]) {
        Logger.info(
            '🐛',
            `[${typeof window === 'undefined' ? 'Server' : 'Client'}]`,
            ...data,
        );
    }
}
