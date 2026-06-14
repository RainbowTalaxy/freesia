import { Metadata } from 'next';
import LogPanel from '../components/LogPanel';

export const metadata: Metadata = {
    title: '日志信息',
};

export default function Page() {
    return (
        <div className="page">
            <h1>日志信息</h1>
            <LogPanel />
        </div>
    );
}
