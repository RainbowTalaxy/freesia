'use client';

import { useEffect, useState } from 'react';

interface Props {
    className?: string;
    children?: React.ReactNode;
}

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
                    '#fff': 'none',
                },
            }).then(setHtml);
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
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Code;
