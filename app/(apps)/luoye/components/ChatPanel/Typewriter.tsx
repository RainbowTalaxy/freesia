import { useState, useEffect, useRef, memo } from 'react';
import Markdown from '../Markdown';

interface Props {
    content: string;
}

// 基础打字速度（字符/秒），落后越多时会动态加速
const BASE_SPEED = 40;
const MAX_SPEED = 400;

const Typewriter = memo(({ content }: Props) => {
    const [displayedContent, setDisplayedContent] = useState(content);

    // 用 ref 存储动画状态，避免 effect 依赖 displayedContent 导致的链式重渲染
    const animRef = useRef({
        displayed: content.length,
        target: content,
        rafId: null as number | null,
        lastTime: null as number | null,
        fraction: 0,
    });

    useEffect(() => {
        const a = animRef.current;
        a.target = content;

        // 内容缩短（清空/重置）：立即同步，取消动画
        if (content.length < a.displayed) {
            a.displayed = content.length;
            a.fraction = 0;
            setDisplayedContent(content);
            if (a.rafId !== null) {
                cancelAnimationFrame(a.rafId);
                a.rafId = null;
                a.lastTime = null;
            }
            return;
        }

        // 已追上，无需动画
        if (content.length === a.displayed) return;

        // 动画循环已在运行，只需更新 target 即可（上面已更新）
        if (a.rafId !== null) return;

        // 启动时间驱动的动画循环
        const animate = (timestamp: number) => {
            if (a.lastTime === null) a.lastTime = timestamp;

            // 限制单帧最大步进，避免页面切换回来时大幅跳跃
            const delta = Math.min((timestamp - a.lastTime) / 1000, 0.1);
            a.lastTime = timestamp;

            const remaining = a.target.length - a.displayed;
            if (remaining <= 0) {
                a.rafId = null;
                a.lastTime = null;
                a.fraction = 0;
                return;
            }

            // 落后越多越快，给人以"追赶"的流畅感
            const speed = Math.min(MAX_SPEED, Math.max(BASE_SPEED, remaining * 10));
            a.fraction += speed * delta;

            const chars = Math.floor(a.fraction);
            a.fraction -= chars;

            if (chars > 0) {
                a.displayed = Math.min(a.displayed + chars, a.target.length);
                setDisplayedContent(a.target.slice(0, a.displayed));
            }

            a.rafId = requestAnimationFrame(animate);
        };

        a.rafId = requestAnimationFrame(animate);
    }, [content]);

    // 卸载时清理 RAF
    useEffect(() => {
        return () => {
            const a = animRef.current;
            if (a.rafId !== null) cancelAnimationFrame(a.rafId);
        };
    }, []);

    return <Markdown title="">{displayedContent}</Markdown>;
});

Typewriter.displayName = 'Typewriter';

export default Typewriter;
