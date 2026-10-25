'use client';
import { useEffect, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import useKeyboard from '@/hooks/useKeyboard';
import styles from '../../styles/document.module.css';
import Toast from '../Notification/Toast';
import { PLACE_HOLDER, countText } from './configs';
import {
    EditorProps,
    EditorSelection,
    EditorSelectionState,
} from './configs/types';

function isInside(element: HTMLElement, node: Node | null) {
    return Boolean(node && element.contains(node));
}

const TextEditor = ({
    className,
    visible,
    keyId,
    onSave,
    defaultValue,
    textRef,
    onSelectionChange,
}: EditorProps) => {
    const eleRef = useRef<HTMLPreElement>(null);

    useKeyboard('Tab', () => {
        if (visible && eleRef.current) document.execCommand('insertText', false, '\t');
    });

    useKeyboard(
        's',
        () => {
            if (visible && eleRef.current) onSave(eleRef.current.innerText);
        },
        {
            ctrl: true,
        },
    );

    const readSelection = (): EditorSelection | null => {
        const element = eleRef.current;
        const selection = window.getSelection();
        if (!element || !selection || selection.rangeCount === 0) return null;
        const range = selection.getRangeAt(0);
        if (
            range.collapsed ||
            !isInside(element, range.startContainer) ||
            !isInside(element, range.endContainer)
        )
            return null;
        const text = selection.toString();
        if (!text.trim()) return null;

        const startRange = range.cloneRange();
        startRange.selectNodeContents(element);
        startRange.setEnd(range.startContainer, range.startOffset);
        const start = startRange.toString().length;
        return { text, start, end: start + text.length };
    };

    useImperativeHandle(
        textRef,
        () => ({
            focus: () => eleRef.current?.focus(),
            setText: (text: string) => {
                eleRef.current!.innerText = text;
                eleRef.current!.dataset.placeholder = text ? '' : PLACE_HOLDER;
            },
            getText: () => {
                let text = eleRef.current!.innerText;
                // 去除行间多余的空行
                text = text.replace(/\n{3,}/g, '\n\n');
                return text;
            },
            getSelection: readSelection,
            loaded: () => true,
        }),
        [],
    );

    useEffect(() => {
        if (visible) {
            if (eleRef.current) {
                eleRef.current.focus();
                eleRef.current.innerText = defaultValue ?? '';
                eleRef.current.dataset.placeholder = defaultValue ? '' : PLACE_HOLDER;
                Toast.notify('字数：' + countText(eleRef.current?.innerText ?? ''), false);
            }
        }
        return () => {
            if (visible) Toast.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, keyId]);

    useEffect(() => {
        const element = eleRef.current;
        if (!visible) {
            onSelectionChange?.(null);
            return;
        }

        const emitSelection = () => {
            const selection = readSelection();
            if (!selection) {
                onSelectionChange?.(null);
                return;
            }
            const domSelection = window.getSelection();
            const range = domSelection?.rangeCount
                ? domSelection.getRangeAt(0)
                : null;
            const rect = range?.getBoundingClientRect();
            const fallbackRect = eleRef.current?.getBoundingClientRect();
            const state: EditorSelectionState = {
                ...selection,
                x: rect?.right ?? fallbackRect?.right ?? 0,
                y: (rect?.top ?? fallbackRect?.top ?? 0) - 10,
            };
            onSelectionChange?.(state);
        };

        document.addEventListener('selectionchange', emitSelection);
        element?.addEventListener('mouseup', emitSelection);
        element?.addEventListener('keyup', emitSelection);
        return () => {
            document.removeEventListener('selectionchange', emitSelection);
            element?.removeEventListener('mouseup', emitSelection);
            element?.removeEventListener('keyup', emitSelection);
            onSelectionChange?.(null);
        };
    }, [visible, onSelectionChange]);

    return (
        <div className={styles.docInputContainer}>
            <pre
                ref={eleRef}
                className={clsx(styles.docInput, className)}
                style={{ display: visible ? '' : 'none' }}
                contentEditable
                spellCheck={false}
                data-placeholder={PLACE_HOLDER}
                onInput={(e) => {
                    const text = e.currentTarget.innerText;
                    e.currentTarget.dataset.placeholder = text ? '' : PLACE_HOLDER;
                    if (text !== undefined) Toast.notify('字数：' + countText(text), false);
                    onSelectionChange?.(null);
                }}
                onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                }}
            ></pre>
        </div>
    );
};

export default TextEditor;
