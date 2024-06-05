import './styles/index.css';
import { BASE_PATH } from '@/app/constants';
import { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
    title: '落页',
    description: '',
    icons: {
        icon: `${BASE_PATH}/luoye.png`,
    },
};

export const viewport: Viewport = {
    themeColor: '#fff8ed',
};

interface Props {
    children: ReactNode;
}

export default async function Layout({ children }: Props) {
    return children;
}
