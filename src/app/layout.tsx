import type { Metadata } from 'next';
import './globals.css';
import { BASE_PATH } from './constants';

export const metadata: Metadata = {
    title: 'freesia',
    description: '',
    icons: {
        icon: `${BASE_PATH}/mercy.png`,
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
