import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { Logger } from '@/utils';
import { BODY_ENABLED_METHODS, LOCAL_URL } from './constants';
import { ResponseError } from '../types';
import { API, HTTPMethod } from '.';

export async function rawServerFetch<Data>(
    url: string,
    method: HTTPMethod,
    data?: string,
) {
    const res = await fetch(LOCAL_URL + url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Cookie: cookies().toString(),
        },
        body: data,
    });
    const result = (await res.json()) as Data;
    const ip = headers().get('X-Forwarded-For') || 'unknown';
    Logger.info(
        res.ok ? '🔆' : '🚫',
        `[${ip}] [${method}] [${res.status}] ${url}`,
    );
    return {
        result,
        isOk: res.ok,
    };
}

const cachedRawServerFetch = cache(rawServerFetch);

async function serverFetch<Data>(api: API<Data>): Promise<Data>;
async function serverFetch<Data>(
    api: API<Data>,
    ignoreError: boolean,
    useRenderCache?: boolean,
): Promise<Data | null>;
async function serverFetch<Data>(
    api: API<Data>,
    ignoreError?: boolean,
    useRenderCache = true,
): Promise<Data | null> {
    let { url, method, data } = api;
    const isBodyEnabled = BODY_ENABLED_METHODS.includes(method);
    if (!isBodyEnabled) {
        url = url + (data ? '?' + new URLSearchParams(data).toString() : '');
    }
    const reqData =
        isBodyEnabled && data !== undefined ? JSON.stringify(data) : undefined;

    const fetcher = useRenderCache ? cachedRawServerFetch : rawServerFetch;
    const { result, isOk } = await fetcher<Data>(url, method, reqData);

    if (!isOk) {
        if (ignoreError) return null;
        throw new Error((result as ResponseError).message || '未知错误');
    }
    return result;
}

export default serverFetch;
