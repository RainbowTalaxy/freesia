import API from '@/app/api';
import Login from './components/Login';
import Logout from './components/Logout';
import { Metadata } from 'next';
import serverFetch from '@/app/api/fetch/server';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: '用户登陆',
};

export default async function Page() {
    let userId: string | null = null;
    try {
        const user = await API.user.test()(serverFetch);
        userId = user.id;
    } catch {}

    return (
        <div className="px-[24px] py-[36px] m-auto max-w-[540px]">
            <h1 className="mb-[16px] text-[32px] font-bold">用户登陆</h1>
            <p className="mb-[16px]">
                当前用户：
                {userId ?? <span className="text-gray-500">暂未登陆</span>}
            </p>
            {!userId ? (
                <Suspense>
                    <Login />
                </Suspense>
            ) : (
                <Logout />
            )}
        </div>
    );
}
