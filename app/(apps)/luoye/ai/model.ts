import { ChatOpenAI } from '@langchain/openai';

export const getMimoModel = () =>
    new ChatOpenAI({
        model: 'mimo-v2-flash',
        temperature: 0.5,
        configuration: {
            baseURL: 'https://api.xiaomimimo.com/v1',
        },
    });
