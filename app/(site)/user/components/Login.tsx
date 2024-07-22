'use client';
import { HTMLInputTypeAttribute, ReactNode } from 'react';
import API, { clientFetch } from '@/api';
import { useRouter, useSearchParams } from 'next/navigation';

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
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get('next_url') ?? null;

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const username = form.username.value;
                const password = form.password.value;
                try {
                    await clientFetch(API.user.login(username, password));
                    if (nextUrl) {
                        window.location.href = nextUrl;
                    } else {
                        router.refresh();
                    }
                } catch (error: any) {
                    alert(`登录失败：${error.message}`);
                }
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
                登录
            </button>
        </form>
    );
}
