import { ResponseError } from '../types';
import { BODY_ENABLED_METHODS } from './constants';

export default async function clientFetch<Data>(
    url: string,
    method: string,
    data?: any,
) {
    const isBodyEnabled = BODY_ENABLED_METHODS.includes(method);
    if (!isBodyEnabled) {
        url = url + (data ? '?' + new URLSearchParams(data).toString() : '');
    }
    const options =
        isBodyEnabled && data !== undefined
            ? {
                  body: JSON.stringify(data),
              }
            : {};
    const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });
    const result = (await res.json()) as Data;
    if (!res.ok)
        throw new Error((result as ResponseError).message || '未知错误');
    return result;
}
