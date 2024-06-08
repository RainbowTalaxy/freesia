'use client';
import styles from '../../styles/document.module.css';
import clsx from 'clsx';
import { useEffect, useImperativeHandle, useRef } from 'react';
import Toast from '../Notification/Toast';
import useKeyboard from '@/app/hooks/useKeyboard';
import { PLACE_HOLDER, countText } from './configs';
import { EditorProps } from './configs/types';

const TextEditor = ({ className, visible, keyId, onSave, defaultValue, textRef }: EditorProps) => {
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
    }, [visible, keyId, defaultValue]);

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
