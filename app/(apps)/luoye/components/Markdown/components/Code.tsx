'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from '../index.module.css';
import clsx from 'clsx';

interface Props {
    className?: string;
    children?: React.ReactNode;
}

const CopyIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" />
        <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18.333 6a3.667 3.667 0 0 1 3.667 3.667v8.666a3.667 3.667 0 0 1 -3.667 3.667h-8.666a3.667 3.667 0 0 1 -3.667 -3.667v-8.666a3.667 3.667 0 0 1 3.667 -3.667zm-3.333 -4c1.094 0 1.828 .533 2.374 1.514a1 1 0 1 1 -1.748 .972c-.221 -.398 -.342 -.486 -.626 -.486h-10c-.548 0 -1 .452 -1 1v9.998c0 .32 .154 .618 .407 .805l.1 .065a1 1 0 1 1 -.99 1.738a3 3 0 0 1 -1.517 -2.606v-10c0 -1.652 1.348 -3 3 -3zm1.293 9.293l-3.293 3.292l-1.293 -1.292a1 1 0 0 0 -1.414 1.414l2 2a1 1 0 0 0 1.414 0l4 -4a1 1 0 0 0 -1.414 -1.414" />
    </svg>
);

const CopyButton = ({ code }: { code: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }, [code]);

    return (
        <button className={clsx(styles.copyBtn, copied && styles.copied)} title="复制代码" onClick={handleCopy}>
            {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
    );
};

const Code = ({ className, children }: Props) => {
    const [html, setHtml] = useState<string | null>(null);

    const code = String(children).replace(/\n$/, '');
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';

    useEffect(() => {
        if (!match) return;

        import('shiki').then(({ codeToHtml }) => {
            codeToHtml(code, {
                lang: language,
                theme: 'github-light',
                // themes: {
                //     light: 'github-light',
                //     dark: 'github-dark',
                // },
                colorReplacements: {
                    '#fff': 'transparent',
                },
            })
                .then(setHtml)
                .catch((_) => {});
        });
    }, [code, language, match]);

    // 行内代码
    if (!match) {
        return <code className={className}>{children}</code>;
    }

    // 代码块 - 加载中或 SSR
    if (!html) {
        return <code className={className}>{children}</code>;
    }

    // 代码块 - 高亮渲染
    return (
        <div className={clsx('code-block', styles.codeBlock)}>
            <CopyButton code={code} />
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
};

export default Code;
