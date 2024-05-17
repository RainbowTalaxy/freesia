import API from '.';
import serverFetch from './fetch/server';

const Server = {
    userId: async () => {
        try {
            const { id: userId } = await API.user.test()(serverFetch);
            return userId;
        } catch {
            return null;
        }
    },
};

export default Server;
