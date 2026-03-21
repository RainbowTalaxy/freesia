import { ChatOpenAI } from '@langchain/openai';
import { IS_DEV } from '../configs';

export const getMimoModel = () =>
    new ChatOpenAI({
        model: IS_DEV ? 'mimo-v2-flash' : 'mimo-v2-pro',
        temperature: 0.5,
        configuration: {
            baseURL: 'https://api.xiaomimimo.com/v1',
        },
    });
