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
    preContent?: ReactNode;
}

const Markdown = ({ children, preContent }: Props) => {
    return (
        <article className="article">
            {preContent}
            <ReactMarkdown>{children}</ReactMarkdown>
        </article>
    );
};

export default Markdown;
