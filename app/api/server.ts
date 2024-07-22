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
};

export default Server;
export { default as serverFetch } from './fetch/server';
