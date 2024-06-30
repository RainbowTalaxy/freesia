import { BASE_PATH } from '../constants';

const Path = {
    of: (path: string, query?: any) => {
        return (
            BASE_PATH +
            path +
            (query ? '?' + new URLSearchParams(query).toString() : '')
        );
    },
    static: (path: string) => {
        return Path.of(path);
    },
    toUserConfig: (nextUrl?: string) => {
        window.location.href = Path.of('/user', {
            next_url: nextUrl ?? window.location.href,
        });
    },
    ofTokenDigest: (token: string, nextUrl: string) => {
        return Path.of('/user/token', { token, next_url: nextUrl });
    },
};

export default Path;
