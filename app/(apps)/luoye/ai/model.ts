import { createMimoChatModel } from './mimo-chat-model';
import { IS_DEV } from '../configs';

export const getMimoModel = () =>
    createMimoChatModel({
        model: IS_DEV ? 'mimo-v2.6-flash' : 'mimo-v2.6-pro',
        modelKwargs: { thinking: { type: 'enabled' } },
        configuration: {
            baseURL: 'https://api.xiaomimimo.com/v1',
        },
    });
