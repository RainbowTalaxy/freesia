import LuoyeAPI from './luoye';
import PlaylistAPI from './playlist';
import UserAPI from './user';

const API = {
    user: UserAPI,
    luoye: LuoyeAPI,
    playlist: PlaylistAPI,
};

export default API;
export { default as clientFetch } from './fetch/client';
