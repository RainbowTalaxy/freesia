import './styles/index.css';
import { BASE_PATH } from '../../constants';
import { Logger, Path } from '../../utils';
import { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
    title: '落页',
    description: '',
    icons: {
        icon: Path.static('/luoye.png'),
    },
};

export const viewport: Viewport = {
    themeColor: 'var(--ly-background)',
};

interface Props {
    children: ReactNode;
}

export default async function Layout({ children }: Props) {
    return children;
}
