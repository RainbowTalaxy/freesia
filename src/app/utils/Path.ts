import { BASE_PATH } from '../constants';

const Path = {
    toUserConfig: () => {
        window.location.href =
            BASE_PATH +
            '/user' +
            '?nextUrl=' +
            encodeURIComponent(window.location.href);
    },
};

export default Path;
