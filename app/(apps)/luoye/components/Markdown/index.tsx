import styles from './index.module.css';
import ReactMarkdown from 'react-markdown';
import remarkToc from './plugins/remarkToc';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeRaw from 'rehype-raw';
import Img from './components/Image';

interface Props {
    children: string;
    title: string;
}

const Markdown = ({ children, title }: Props) => {
    return (
        <article className={styles.article}>
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
