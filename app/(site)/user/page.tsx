import { Suspense } from 'react';
import { Metadata } from 'next';
import Login from './components/Login';
import Logout from './components/Logout';
import Server from '../../api/server';

export const metadata: Metadata = {
    title: '用户登录',
};

export default async function Page() {
    const userId = await Server.userId();

    return (
        <div className="px-[24px] py-[36px] m-auto max-w-[540px]">
            <h1 className="mb-[16px] text-[32px] font-bold">用户登录</h1>
            {!userId ? (
                <Suspense>
                    <Login />
                </Suspense>
            ) : (
                <>
                    <p className="mb-[16px]">
                        当前用户：
                        {userId ?? (
                            <span className="text-gray-500">暂未登录</span>
                        )}
                    </p>
                    <Logout />
                </>
            )}
        </div>
    );
}
