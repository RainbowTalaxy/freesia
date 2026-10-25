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
import {
    EditorProps,
    EditorSelection,
    EditorSelectionState,
} from './configs/types';
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

function readSelection(
    editor: monaco.editor.IStandaloneCodeEditor,
): EditorSelection | null {
    const model = editor.getModel();
    const selection = editor.getSelection();
    if (!model || !selection || selection.isEmpty()) return null;
    const text = model.getValueInRange(selection);
    if (!text.trim()) return null;
    return {
        text,
        start: model.getOffsetAt(selection.getStartPosition()),
        end: model.getOffsetAt(selection.getEndPosition()),
    };
}

function readSelectionState(
    editor: monaco.editor.IStandaloneCodeEditor,
): EditorSelectionState | null {
    const selection = readSelection(editor);
    if (!selection) return null;
    const range = editor.getSelection();
    const domNode = editor.getDomNode();
    if (!range || !domNode) return null;
    const startPosition = editor.getScrolledVisiblePosition(range.getStartPosition());
    const endPosition = editor.getScrolledVisiblePosition(range.getEndPosition());
    if (!startPosition || !endPosition) return null;
    const rect = domNode.getBoundingClientRect();
    return {
        ...selection,
        x:
            rect.left +
            (range.startLineNumber === range.endLineNumber
                ? endPosition.left
                : Math.max(
                      endPosition.left,
                      editor.getLayoutInfo().contentWidth,
                  )),
        y: rect.top + startPosition.top - 10,
    };
}

const MarkdownEditor = ({
    className,
    visible,
    keyId,
    onSave,
    textRef,
    defaultValue,
    onSelectionChange,
}: EditorProps) => {
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
            getSelection: () =>
                editorRef.current ? readSelection(editorRef.current) : null,
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

                const emitSelection = () => {
                    onSelectionChange?.(readSelectionState(editor));
                };
                editor.onDidChangeCursorSelection(emitSelection);
                editor.onDidScrollChange(emitSelection);
                editor.onDidChangeModelContent(() => {
                    onSelectionChange?.(null);
                });
                emitSelection();
            }}
            onChange={(value) => {
                if (value !== undefined) Toast.notify('字数：' + countText(value), false);
            }}
        />
    );
};

export default MarkdownEditor;
