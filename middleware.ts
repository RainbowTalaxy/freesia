import { NextRequest } from 'next/server';
import { Logger } from './app/utils';
import Server from '@/api/server';

function logRoute(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/_next')) return;
    if (pathname.startsWith('/api')) return;
    if (pathname.endsWith('.png')) return;
    const ip = request.headers.get('X-Forwarded-For') || 'unknown';
    Logger.route(ip, pathname, request.nextUrl.searchParams);
    Server.uploadLog(`FREESIA [${ip}] ${pathname} ${request.nextUrl.search}`);
}

export async function middleware(request: NextRequest) {
    logRoute(request);
}
