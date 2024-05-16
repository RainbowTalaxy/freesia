import type { Metadata } from 'next';
import nextConfig from '../../../../next.config.mjs';

export const metadata: Metadata = {
    title: '落页',
    description: '',
    icons: {
        icon: `${nextConfig.basePath}/luoye.png`,
    },
};

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
