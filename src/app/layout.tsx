import type { Metadata } from 'next';
import './globals.css';
import nextConfig from '../../next.config.mjs';

export const metadata: Metadata = {
    title: 'freesia',
    description: '',
    icons: {
        icon: `${nextConfig.basePath}/mercy.png`,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
