import './globals.css';
import type { Metadata } from 'next';
import { Path } from './utils';

export const metadata: Metadata = {
    title: 'freesia',
    description: '',
    icons: {
        icon: Path.static('/mercy.png'),
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
