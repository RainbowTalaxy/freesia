import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';
import { ActionResult } from './types';

const UserAPI = {
    info: () => Rocket.get<{ id: string }>(`${API_PREFIX}/user`),
    login: (id: string, password: string, expireTime?: number) =>
        Rocket.post<{ token: string }>(`${API_PREFIX}/user/login`, {
            id,
            password,
            expireTime,
        }),
    logout: () => Rocket.post<ActionResult>(`${API_PREFIX}/user/logout`),
    tokenDigest: (token: string) =>
        Rocket.post<ActionResult>(`${API_PREFIX}/user/digest`, {
            token,
        }),
};

export default UserAPI;
