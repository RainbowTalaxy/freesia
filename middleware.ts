import { NextRequest } from 'next/server';
import { Logger } from './app/utils';

function logRoute(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    if (pathname.startsWith('/_next')) return;
    if (pathname.startsWith('/api')) return;
    if (pathname.endsWith('.png')) return;
    Logger.route(
        request.headers.get('X-Forwarded-For') || 'unknown',
        pathname,
        request.nextUrl.searchParams,
    );
}

export async function middleware(request: NextRequest) {
    logRoute(request);
}
