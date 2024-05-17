export default class Logger {
    static info(icon: string, message: string) {
        console.log(`[${new Date().toLocaleString()}]`, icon, message);
    }

    static error(message: string) {
        this.info('🚫', message);
    }
}
