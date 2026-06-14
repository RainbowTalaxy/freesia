import { API } from '.';
import { ResponseError } from '../types';
import { BODY_ENABLED_METHODS } from './constants';

export default async function clientFetch<Data>(
    api: API<Data>,
    controller?: AbortController,
    options?: {
        /** 返回 response 对象 */
        keepResponse?: false;
    },
): Promise<Data>;
export default async function clientFetch<Data>(
    api: API<Data>,
    controller?: AbortController,
    options?: {
        /** 返回 response 对象 */
        keepResponse: true;
    },
): Promise<Response>;
export default async function clientFetch<Data>(
    api: API<Data>,
    controller?: AbortController,
    options?: {
        /** 返回 response 对象 */
        keepResponse?: boolean;
    },
) {
    let { url, method, data } = api;
    const isBodyEnabled = BODY_ENABLED_METHODS.includes(method);
    if (!isBodyEnabled) {
        url = url + (data ? '?' + new URLSearchParams(data).toString() : '');
    }
    const payload =
        isBodyEnabled && data !== undefined
            ? {
                  body: JSON.stringify(data),
              }
            : {};
    const res = await fetch(url, {
        signal: controller?.signal,
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        ...payload,
    });

    // 如果需要保留原始 Response 对象（例如为了获取 headers），则直接返回
    if (options?.keepResponse) return res;

    const result = (await res.json()) as Data;
    if (!res.ok)
        throw new Error((result as ResponseError).message || '未知错误');
    return result;
}
