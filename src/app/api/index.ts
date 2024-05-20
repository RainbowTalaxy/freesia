import LuoyeAPI from './luoye';
import UserAPI from './user';

const API = {
    user: UserAPI,
    luoye: LuoyeAPI,
};

export default API;
export { default as clientFetch } from './fetch/client';
