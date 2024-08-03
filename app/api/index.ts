import LuoyeAPI from './luoye';
import SupportAPI from './support';
import UserAPI from './user';

const API = {
    user: UserAPI,
    luoye: LuoyeAPI,
    support: SupportAPI,
};

export default API;
export { default as clientFetch } from './fetch/client';
