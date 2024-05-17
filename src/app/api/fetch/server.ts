import { cookies } from 'next/headers';
import { BODY_ENABLED_METHODS, LOCAL_URL } from './constants';
import { ResponseError } from '../types';
import Logger from '@/app/utils/Log';

export default async function serverFetch<Data>(
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
    const res = await fetch(LOCAL_URL + url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Cookie: cookies().toString(),
        },
        ...options,
    });
    const result = (await res.json()) as Data;
    Logger.info(res.ok ? '🔆' : '🚫', `[${method}] [${res.status}] ${url}`);
    if (!res.ok)
        throw new Error((result as ResponseError).message || '未知错误');
    return result;
}
