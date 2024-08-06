import LuoyeAPI from './luoye';
import SupportAPI from './support';
import PlaylistAPI from './playlist';
import UserAPI from './user';

const API = {
    user: UserAPI,
    luoye: LuoyeAPI,
    support: SupportAPI,
    playlist: PlaylistAPI,
};

export default API;
export { default as clientFetch } from './fetch/client';
