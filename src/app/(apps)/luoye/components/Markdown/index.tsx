import './style.css';
import ReactMarkdown from 'react-markdown';
import { ReactNode } from 'react';

interface Slug {
    title: string;
    slug: string;
}

interface Props {
    toc: (slugs: Array<Slug>) => ReactNode;
    children: string;
}

const Markdown = ({ children, toc }: Props) => {
    return <ReactMarkdown>{children}</ReactMarkdown>;
};

export default Markdown;
