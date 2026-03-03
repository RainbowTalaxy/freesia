import { useState, useEffect, memo } from 'react';
import Markdown from '../Markdown';

interface Props {
    content: string;
}

const Typewriter = memo(({ content }: Props) => {
    const [displayedContent, setDisplayedContent] = useState(() => content);

    useEffect(() => {
        // 1. 如果内容变短了（清空或撤销），立即同步，不要打字机回退
        if (content.length < displayedContent.length) {
            setDisplayedContent(content);
            return;
        }

        // 2. 如果已经追上，停止
        if (displayedContent.length === content.length) {
            return;
        }

        // 3. 还没追上，计算下一帧
        const frameId = requestAnimationFrame(() => {
            const remaining = content.length - displayedContent.length;
            // 动态速度：剩余越多越快，避免落后太多
            const step = Math.max(1, Math.ceil(remaining / 10));

            setDisplayedContent(content.slice(0, displayedContent.length + step));
        });

        return () => cancelAnimationFrame(frameId);
    }, [content, displayedContent]);

    return <Markdown title="">{displayedContent}</Markdown>;
});

Typewriter.displayName = 'Typewriter';

export default Typewriter;
