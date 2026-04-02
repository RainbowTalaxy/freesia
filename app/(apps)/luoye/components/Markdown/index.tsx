import styles from './index.module.css';
import ReactMarkdown from 'react-markdown';
import remarkToc from './plugins/remarkToc';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import Img from './components/Image';
import Code from './components/Code';

interface Props {
    children: string;
    title: string;
    enableToc?: boolean;
}

const Markdown = ({ children, title, enableToc = false }: Props) => {
    return (
        <article className={styles.article}>
            <ReactMarkdown
                components={{
                    img: Img,
                    code: Code,
                    // a: ({ children, href, ...props }) => (
                    //     <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                    //         {children}
                    //     </a>
                    // ),
                }}
                remarkPlugins={[...(enableToc ? [() => remarkToc(title)] : []), remarkGfm, remarkRehype]}
                rehypePlugins={[rehypeSlug, rehypeRaw]}
            >
                {children}
            </ReactMarkdown>
        </article>
    );
};

export default Markdown;
