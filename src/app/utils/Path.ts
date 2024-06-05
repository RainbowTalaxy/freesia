import { BASE_PATH } from '../constants';

const Path = {
    toUserConfig: () => {
        window.location.href =
            BASE_PATH +
            '/user' +
            '?next_url=' +
            encodeURIComponent(window.location.href);
    },
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
    ofTokenDigest: (token: string, nextUrl: string) => {
        return Path.of('/user/token', { token, next_url: nextUrl });
    },
};

export default Path;
