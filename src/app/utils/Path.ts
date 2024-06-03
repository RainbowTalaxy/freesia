import { BASE_PATH } from '../constants';

const Path = {
    toUserConfig: () => {
        window.location.href =
            BASE_PATH +
            '/user' +
            '?next_url=' +
            encodeURIComponent(window.location.href);
    },
    of: (path: string) => {
        return BASE_PATH + path;
    },
    static: (path: string) => {
        return Path.of(path);
    },
};

export default Path;
