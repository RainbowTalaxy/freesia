'use client';

import API from '@/app/api';
import clientFetch from '@/app/api/fetch/client';
import { useRouter } from 'next/navigation';
import { HTMLInputTypeAttribute, ReactNode } from 'react';

const Label = ({ field, children }: { field: string; children: ReactNode }) => (
    <label className="block font-bold mb-[4px]" htmlFor={field}>
        {children}
    </label>
);

const Input = ({
    field,
    type = 'text',
}: {
    field: string;
    type?: HTMLInputTypeAttribute;
}) => (
    <input
        className="block w-[100%] mb-[16px] px-[14px] py-[6px] border-[1px] border-gray-300 rounded font-[6px]"
        name={field}
        type={type}
    />
);

export default function Login() {
    const router = useRouter();

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const username = form.username.value;
                const password = form.password.value;
                await API.user.login(username, password)(clientFetch);
                router.refresh();
            }}
        >
            <Label field="username">用户名</Label>
            <Input field="username" />
            <Label field="password">密码</Label>
            <Input field="password" type="password" />
            <button
                className="mt-[16px] px-[16px] py-[8px] bg-[#6a8bad] text-white rounded-[6px]"
                type="submit"
            >
                登陆
            </button>
        </form>
    );
}
