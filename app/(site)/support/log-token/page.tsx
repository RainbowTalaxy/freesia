import API from '@/api';
import { serverFetch } from '@/api/server';
import { Metadata } from 'next';
import LogTokenForm from '../components/LogTokenForm';
import LogTokenItem from '../components/LogTokenItem';

export const metadata: Metadata = {
    title: '日志权限',
};

export default async function Page() {
    const logTokens = await serverFetch(API.support.admin.logTokens(), true);

    if (!logTokens)
        return (
            <div className="page">
                <h1>无权访问</h1>
            </div>
        );

    return (
        <div className="page">
            <h1>日志权限</h1>
            <LogTokenForm />
            <h2>权限列表</h2>
            {logTokens.length === 0 && <p className="ml-1">无日志权限</p>}
            <ul>
                {logTokens.map((logToken) => (
                    <LogTokenItem key={logToken.token} token={logToken} />
                ))}
            </ul>
        </div>
    );
}
