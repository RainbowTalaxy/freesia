import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';

const SupportAPI = {
    admin: {
        logTokens: () =>
            Rocket.get<Array<LogToken>>(
                `${API_PREFIX}/support/admin/log-tokens`,
            ),
        createLogToken: (title: string) =>
            Rocket.post<LogToken>(`${API_PREFIX}/support/admin/log-token`, {
                title,
            }),
        deleteLogToken: (token: string) =>
            Rocket.delete<LogToken>(
                `${API_PREFIX}/support/admin/log-token/${token}`,
            ),
        log: (date: string) =>
            Rocket.get<{ log: string }>(
                `${API_PREFIX}/support/admin/log/${date}`,
            ),
        uploadLog: (message: string) =>
            Rocket.post<string>(`${API_PREFIX}/support/log`, { message }),
    },
    uploadLog: (message: string, logToken: string) =>
        Rocket.post<string>(`${API_PREFIX}/support/log`, {
            message,
            token: logToken,
        }),
};

export default SupportAPI;
