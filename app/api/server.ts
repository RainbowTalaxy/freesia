import API from '.';
import serverFetch from './fetch/server';

const Server = {
    userId: async () => {
        try {
            const { id: userId } = await serverFetch(API.user.info());
            return userId;
        } catch {
            return null;
        }
    },
    uploadLog: (() => {
        const logToken = process.env.LOG_TOKEN;
        if (!logToken) return () => {};
        let lastUploadTime: number = 0;
        let messageBuffer: string[] = [];
        return (message: string) => {
            messageBuffer.push(message);
            if (Date.now() - lastUploadTime > 1000) {
                lastUploadTime = Date.now();
                const messageCount = messageBuffer.length;
                const messages = messageBuffer
                    .splice(0, messageCount)
                    .join('\n');
                serverFetch(
                    API.support.uploadLog(messages, logToken),
                    true,
                    false,
                );
            }
        };
    })(),
};

export default Server;
export { default as serverFetch } from './fetch/server';
