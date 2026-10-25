import { EditorSelectionState } from './configs/types';

interface RangeLike extends Range {
    cloneRange: () => Range;
}

export function getSelectionStateFromRange(
    container: HTMLElement,
    range: RangeLike,
): EditorSelectionState | null {
    if (
        range.collapsed ||
        !container.contains(range.startContainer) ||
        !container.contains(range.endContainer)
    ) {
        return null;
    }

    const text = range.toString();
    if (!text.trim()) return null;

    const startRange = range.cloneRange();
    startRange.selectNodeContents(container);
    startRange.setEnd(range.startContainer, range.startOffset);
    const start = startRange.toString().length;
    const rect = range.getBoundingClientRect();

    return {
        text,
        start,
        end: start + text.length,
        x: rect.right,
        y: rect.top - 10,
    };
}

export function readRenderedSelection(
    container: HTMLElement | null,
): EditorSelectionState | null {
    if (!container || typeof window === 'undefined') return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return getSelectionStateFromRange(
        container,
        selection.getRangeAt(0) as RangeLike,
    );
}
