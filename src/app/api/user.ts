import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';

const UserAPI = {
    test: () => Rocket.get<{ id: string }>(`${API_PREFIX}/user/test`),
    login: (id: string, password: string, expireTime?: number) =>
        Rocket.post<{ token: string }>(`${API_PREFIX}/user/login`, {
            id,
            password,
            expireTime,
        }),
    logout: () =>
        Rocket.delete<{ success: boolean }>(`${API_PREFIX}/user/logout`),
};

export default UserAPI;
