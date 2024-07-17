import { cookies } from 'next/headers';
import { BODY_ENABLED_METHODS, LOCAL_URL } from './constants';
import { ResponseError } from '../types';
import Logger from '@/app/utils/Log';
import { cache } from 'react';
import { API } from '.';

async function _rawServerFetch<Data>(
    url: string,
    method: string,
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
    Logger.info(res.ok ? '🔆' : '🚫', `[${method}] [${res.status}] ${url}`);
    return {
        result,
        isOk: res.ok,
    };
}

const rawServerFetch = cache(_rawServerFetch);

async function serverFetch<Data>(api: API<Data>): Promise<Data>;
async function serverFetch<Data>(
    api: API<Data>,
    ignoreError: boolean,
): Promise<Data | null>;
async function serverFetch<Data>(
    api: API<Data>,
    ignoreError?: boolean,
): Promise<Data | null> {
    let { url, method, data } = api;
    const isBodyEnabled = BODY_ENABLED_METHODS.includes(method);
    if (!isBodyEnabled) {
        url = url + (data ? '?' + new URLSearchParams(data).toString() : '');
    }
    const reqData =
        isBodyEnabled && data !== undefined ? JSON.stringify(data) : undefined;
    const { result, isOk } = await rawServerFetch<Data>(url, method, reqData);

    if (!isOk) {
        if (ignoreError) return null;
        throw new Error((result as ResponseError).message || '未知错误');
    }
    return result;
}

export default serverFetch;
