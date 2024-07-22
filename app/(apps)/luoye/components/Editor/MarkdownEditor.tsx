'use client';
import { useEffect, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import * as monaco from 'monaco-editor';
import Editor, { loader } from '@monaco-editor/react';
import useKeyboard from '@/hooks/useKeyboard';
import { MONACO_TOKEN_CONFIG, MONACO_COLOR_CONFIG, MONACO_OPTIONS } from './configs/monaco';
import Toast from '../Notification/Toast';
import { PLACE_HOLDER, countText } from './configs';
import PlaceholderContentWidget from './PlaceholderContentWidget';
import { EditorProps } from './configs/types';
import styles from './editor.module.css';

// 用于页面判断编辑器是否加载完毕
let monacoLoaded = false;

loader.config({ monaco });
loader.init().then((monaco) => {
    monaco.editor.defineTheme('luoye', {
        base: 'vs',
        inherit: true,
        rules: MONACO_TOKEN_CONFIG,
        colors: MONACO_COLOR_CONFIG,
    });
    monacoLoaded = true;
});

const MarkdownEditor = ({ className, visible, keyId, onSave, textRef, defaultValue }: EditorProps) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

    useKeyboard(
        's',
        () => {
            if (visible && editorRef.current) onSave(editorRef.current.getValue());
        },
        {
            ctrl: true,
        },
    );

    useImperativeHandle(
        textRef,
        () => ({
            focus: () => editorRef.current?.focus(),
            setText: (text: string) => editorRef.current?.setValue(text),
            getText: () => editorRef.current?.getValue() || '',
            loaded: () => monacoLoaded,
        }),
        [],
    );

    useEffect(() => {
        if (visible && !editorRef.current?.getValue()) editorRef.current?.focus();
        return () => {
            if (visible) Toast.close();
        };
    }, [visible, keyId]);

    // 编辑器的 visible 样式由外层控制
    return (
        <Editor
            className={clsx(styles.container, className)}
            defaultLanguage="markdown"
            defaultValue=""
            theme="luoye"
            loading={null}
            options={MONACO_OPTIONS}
            onMount={(editor) => {
                editorRef.current = editor;
                new PlaceholderContentWidget(PLACE_HOLDER, editor);
                editor.focus();
                if (defaultValue !== undefined) {
                    editor.setValue(defaultValue);
                    if (visible) Toast.notify('字数：' + countText(defaultValue), false);
                }
            }}
            onChange={(value) => {
                if (value !== undefined) Toast.notify('字数：' + countText(value), false);
            }}
        />
    );
};

export default MarkdownEditor;
