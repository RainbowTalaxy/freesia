import { ReactNode } from 'react';
import '../style.css';

interface Props {
    children: ReactNode;
}

export default function Layout({ children }: Props) {
    return children;
}
