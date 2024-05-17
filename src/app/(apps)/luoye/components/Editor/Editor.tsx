'use client';
import styles from '../../styles/document.module.css';
import clsx from 'clsx';
import {
    ForwardedRef,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import Toast from '../Notification/Toast';
import useKeyboard from '@/app/hooks/useKeyboard';
import { countText } from '../../configs/editor';

export interface EditorProps {
    className?: string;
    visible: boolean;
    keyId: string;
    onSave: (text: string) => void;
}

export interface EditorRef {
    focus: () => void;
    setText: (text: string) => void;
    getText: () => string;
}

const PLACE_HOLDER = '点击此处直接输入正文';

const Editor = forwardRef(
    (
        { className, visible, keyId, onSave }: EditorProps,
        ref: ForwardedRef<EditorRef>,
    ) => {
        const eleRef = useRef<HTMLPreElement>(null);

        useKeyboard('Tab', () => {
            if (visible && eleRef.current)
                document.execCommand('insertText', false, '\t');
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

        useImperativeHandle(
            ref,
            () => ({
                focus: () => eleRef.current?.focus(),
                setText: (text: string) => {
                    eleRef.current!.innerText = text;
                    eleRef.current!.dataset.placeholder = text
                        ? ''
                        : PLACE_HOLDER;
                },
                getText: () => {
                    let text = eleRef.current!.innerText;
                    // 去除行间多余的空行
                    text = text.replace(/\n{3,}/g, '\n\n');
                    return text;
                },
            }),
            [],
        );

        useEffect(() => {
            if (visible) {
                eleRef.current?.focus();
                Toast.notify(
                    '字数：' + countText(eleRef.current?.innerText ?? ''),
                    false,
                );
            }
            return () => {
                if (visible) Toast.close();
            };
        }, [visible, keyId]);

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
                        e.currentTarget.dataset.placeholder = text
                            ? ''
                            : PLACE_HOLDER;
                        if (text)
                            Toast.notify('字数：' + countText(text), false);
                    }}
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData('text/plain');
                        document.execCommand('insertText', false, text);
                    }}
                ></pre>
            </div>
        );
    },
);

export default Editor;
