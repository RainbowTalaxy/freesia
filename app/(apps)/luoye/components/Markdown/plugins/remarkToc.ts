import { Root } from 'mdast';
import { toc } from 'mdast-util-toc';
import styles from '../../../styles/document.module.css';

export default function remarkToc(title: string) {
    return (tree: Root) => {
        const contents = toc(tree, {
            maxDepth: 2,
        }).map;
        if (contents) {
            tree.children.unshift(
                {
                    type: 'html',
                    value: `<div class=${styles.toc}>`,
                },
                {
                    type: 'html',
                    value: `<header id="${title}"><strong><a href="#${encodeURIComponent(
                        title,
                    )}">${title}</a></strong></header>`,
                },
                contents,
                {
                    type: 'html',
                    value: '</div>',
                },
            );
        }
        return tree;
    };
}
