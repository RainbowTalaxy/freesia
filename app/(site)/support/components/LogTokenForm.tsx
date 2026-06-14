'use client';
import API, { clientFetch } from '@/api';
import { Button, Input } from '@/components/form';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

const LogTokenForm = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    return (
        <div className="flex mb-4">
            <Input
                className="mr-4"
                raf={inputRef}
                placeholder="请输入 Token 标题"
            />
            <Button
                type="primary"
                buttonType="submit"
                onClick={async () => {
                    if (!inputRef.current?.value) return alert('标题不得为空');
                    const title = inputRef.current.value;
                    await clientFetch(API.support.admin.createLogToken(title));
                    inputRef.current.value = '';
                    alert('生成成功');
                    router.refresh();
                }}
            >
                生成 Token
            </Button>
        </div>
    );
};

export default LogTokenForm;
