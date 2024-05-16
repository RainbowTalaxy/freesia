'use client';

import API from '@/app/api';
import clientFetch from '@/app/api/fetch/client';
import { useRouter } from 'next/navigation';

export default function Logout() {
    const router = useRouter();

    return (
        <button
            className="mt-[8px] px-[14px] py-[8px] text-[#6a8bad] rounded-[6px] border-[1px] border-[#6a8bad]"
            onClick={async () => {
                try {
                    await API.user.logout()(clientFetch);
                    router.refresh();
                } catch (error: any) {
                    alert(`登出失败：${error.message}`);
                }
            }}
        >
            退出登陆
        </button>
    );
}
