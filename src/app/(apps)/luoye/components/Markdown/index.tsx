import './style.css';
import ReactMarkdown, { Components } from 'react-markdown';
import { ReactNode } from 'react';
import Img from './components/Image';

interface Slug {
    title: string;
    slug: string;
}

interface Props {
    toc: (slugs: Array<Slug>) => ReactNode;
    children: string;
    preContent?: ReactNode;
}

const components: Partial<Components> = {
    img: Img,
};

const Markdown = ({ children, preContent }: Props) => {
    return (
        <article className="article">
            {preContent}
            <ReactMarkdown components={components}>{children}</ReactMarkdown>
        </article>
    );
};

export default Markdown;
