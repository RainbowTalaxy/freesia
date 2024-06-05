import { Path } from '@/app/utils';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

const MAX_DAYS = 120;
const COOKIE_EXPIRE = MAX_DAYS * 24 * 60 * 60;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    if (!token) {
        return { status: 400, body: 'Token is required' };
    }
    cookies().set('token', token, {
        maxAge: COOKIE_EXPIRE,
    });
    const next_url = searchParams.get('next_url');
    redirect(next_url || Path.of('/user'));
}
