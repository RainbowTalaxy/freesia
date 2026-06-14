'use client';
import API, { clientFetch } from '@/api';
import { Button } from '@/components/form';
import { useRouter } from 'next/navigation';

interface Props {
    token: LogToken;
}

const LogTokenItem = ({ token }: Props) => {
    const router = useRouter();

    return (
        <li className="flex items-center px-4 py-2 border border-border rounded-md space-x-3">
            <span className="flex-1">{token.title}</span>
            <Button
                onClick={async () => {
                    if (!navigator.clipboard) return alert('不支持复制');
                    await navigator.clipboard?.writeText(token.token);
                    alert('已复制 Token');
                }}
            >
                复制 Token
            </Button>
            <Button
                type="danger"
                onClick={async () => {
                    const granted = confirm(`确认删除 ${token.title} ？`);
                    if (!granted) return;
                    await clientFetch(
                        API.support.admin.deleteLogToken(token.token),
                    );
                    router.refresh();
                }}
            >
                删 除
            </Button>
        </li>
    );
};

export default LogTokenItem;
