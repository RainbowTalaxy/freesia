import './style.css';
import ReactMarkdown from 'react-markdown';
import remarkToc from './plugins/remarkToc';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import Img from './components/Image';

interface Slug {
    title: string;
    slug: string;
}

interface Props {
    children: string;
    title: string;
}

const Markdown = ({ children, title }: Props) => {
    return (
        <article className="article">
            <ReactMarkdown
                components={{
                    img: Img,
                }}
                remarkPlugins={[() => remarkToc(title), remarkRehype]}
                rehypePlugins={[rehypeSlug, rehypeRaw]}
            >
                {children}
            </ReactMarkdown>
        </article>
    );
};

export default Markdown;
