import { useState, useEffect, useRef, memo } from 'react';
import Markdown from '../Markdown';

interface Props {
    content: string;
}

// 基础打字速度（字符/秒），落后越多时会动态加速
const BASE_SPEED = 40;
const MAX_SPEED = 400;
// 剩余字符数低于此值时直接补全，避免末尾收尾迟缓
const FINISH_THRESHOLD = 2;

const Typewriter = memo(({ content }: Props) => {
    // 初始值故意设为 content 全文：历史消息重新挂载时直接显示，不重播动画
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

        // 先保存旧的 target 用于比较
        const prevTarget = a.target;
        a.target = content;

        // 内容未变化，直接返回
        if (content === prevTarget) return;

        // 内容缩短或清空：立即同步，取消动画
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

        // 等长替换但内容不同：重置动画从头开始
        if (content.length === a.displayed && content !== prevTarget) {
            a.displayed = 0;
            a.fraction = 0;
            setDisplayedContent(''); // 立即清空显示，避免闪烁
            if (a.rafId !== null) {
                cancelAnimationFrame(a.rafId);
                a.rafId = null;
                a.lastTime = null;
            }
            // 启动新动画（下面会处理）
        }

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

            // 剩余极少时直接补全，避免末尾字符因低速而收尾迟缓
            if (remaining <= FINISH_THRESHOLD) {
                a.displayed = a.target.length;
                a.fraction = 0;
                setDisplayedContent(a.target);
                a.rafId = null;
                a.lastTime = null;
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
            if (animRef.current.rafId !== null) {
                cancelAnimationFrame(animRef.current.rafId);
                // eslint-disable-next-line react-hooks/exhaustive-deps
                animRef.current.rafId = null;
            }
        };
    }, []);

    return <Markdown title="">{displayedContent}</Markdown>;
});

Typewriter.displayName = 'Typewriter';

export default Typewriter;
