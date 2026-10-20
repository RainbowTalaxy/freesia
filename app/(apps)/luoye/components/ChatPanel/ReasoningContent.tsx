'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import type { AssistantChatMessage } from '../../ai/chat/types';
import styles from './ChatPanel.module.css';

export interface ReasoningControls {
    reasoningExpanded: Record<string, boolean>;
    onReasoningToggle: (id: string, expanded: boolean) => void;
}

export default function ReasoningContent({
    message,
    expanded,
    onToggle,
}: {
    message: AssistantChatMessage;
    expanded?: boolean;
    onToggle: (id: string, expanded: boolean) => void;
}) {
    const regionId = useId();
    const contentRef = useRef<HTMLDivElement>(null);
    const followRef = useRef(true);
    const isExpanded = expanded ?? !!message.isThinking;

    useLayoutEffect(() => {
        const container = contentRef.current;
        if (container && isExpanded && followRef.current) {
            container.scrollTop = container.scrollHeight;
            const frame = requestAnimationFrame(() => {
                if (followRef.current && contentRef.current) {
                    contentRef.current.scrollTop =
                        contentRef.current.scrollHeight;
                }
            });
            return () => cancelAnimationFrame(frame);
        }
    }, [message.reasoningContent, isExpanded]);

    if (!message.reasoningContent) return null;

    return (
        <div
            className={`${styles.reasoning} ${
                isExpanded ? styles.reasoningExpanded : ''
            }`}
        >
            <button
                type="button"
                className={styles.reasoningToggle}
                aria-expanded={isExpanded}
                aria-controls={regionId}
                onClick={() => onToggle(message.id, !isExpanded)}
            >
                <span className={styles.reasoningTitle}>
                    {message.isThinking ? '正在思考' : '思考过程'}
                    {message.isThinking && (
                        <span
                            className={styles.reasoningDots}
                            aria-hidden="true"
                        >
                            <i />
                            <i />
                            <i />
                        </span>
                    )}
                </span>
                <svg
                    className={styles.reasoningChevron}
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            <div
                className={styles.reasoningCollapse}
                aria-hidden={!isExpanded}
            >
                <div
                    id={regionId}
                    ref={contentRef}
                    className={styles.reasoningText}
                    tabIndex={isExpanded ? 0 : -1}
                    onScroll={() => {
                        const container = contentRef.current;
                        if (container) {
                            followRef.current =
                                container.scrollHeight -
                                    container.scrollTop -
                                    container.clientHeight <
                                10;
                        }
                    }}
                >
                    {message.reasoningContent}
                </div>
            </div>
        </div>
    );
}
