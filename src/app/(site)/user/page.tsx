import API from '@/app/api';
import Login from './components/Login';
import Logout from './components/Logout';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { serverFetch } from '@/app/api/server';

export const metadata: Metadata = {
    title: '用户登录',
};

export default async function Page() {
    let userId: string | null = null;
    try {
        const user = await serverFetch(API.user.test());
        userId = user.id;
    } catch {}

    return (
        <div className="px-[24px] py-[36px] m-auto max-w-[540px]">
            <h1 className="mb-[16px] text-[32px] font-bold">用户登录</h1>
            <p className="mb-[16px]">
                当前用户：
                {userId ?? <span className="text-gray-500">暂未登录</span>}
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
