import { ChatOpenAI } from '@langchain/openai';
import { IS_DEV } from '../configs';

type MimoModelOptions = string | { multimodal?: boolean };

function resolveMimoModel(options?: MimoModelOptions) {
    if (typeof options === 'string') return options;
    if (options?.multimodal) return 'mimo-v2.5';
    return IS_DEV ? 'mimo-v2.5' : 'mimo-v2.5-pro';
}

export const getMimoModel = (options?: MimoModelOptions) =>
    new ChatOpenAI({
        model: resolveMimoModel(options),
        temperature: 0.5,
        configuration: {
            baseURL: 'https://api.xiaomimimo.com/v1',
        },
    });
