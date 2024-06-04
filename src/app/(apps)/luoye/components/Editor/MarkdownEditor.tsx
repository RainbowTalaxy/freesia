'use client';
import styles from './editor.module.css';
import Editor, { loader } from '@monaco-editor/react';
import { useEffect, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import * as monaco from 'monaco-editor';
import { MONACO_TOKEN_CONFIG, MONACO_COLOR_CONFIG } from '../../configs/monaco';
import Toast from '../Notification/Toast';
import useKeyboard from '@/app/hooks/useKeyboard';
import { countText } from '../../configs/editor';
import PlaceholderContentWidget from './PlaceholderContentWidget';
import { EditorProps, PLACE_HOLDER } from './configs';

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

const options: monaco.editor.IStandaloneEditorConstructionOptions = {
    // 控制是否展示行号
    // folding: false,
    // glyphMargin: false,
    // lineDecorationsWidth: 0,
    // lineNumbers: 'off',
    // lineNumbersMinChars: 0,

    // 折行控制
    wrappingStrategy: 'advanced',
    wordWrap: 'on',

    // 字体设置
    fontLigatures: true,
    fontSize: 16,
    fontFamily:
        "'Fira Code', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif",

    // 禁用括号匹配
    matchBrackets: 'never',
    // 问题：https://github.com/microsoft/monaco-editor/issues/3829
    // @ts-ignore
    'bracketPairColorization.enabled': false,
    // 禁用菜单
    contextmenu: false,
    // 光标宽度
    cursorWidth: 1,
    // 右侧 minimap
    minimap: {
        enabled: false,
    },
    // 编辑器边距
    padding: {
        top: 24,
    },
    // 行高亮
    renderLineHighlight: 'none',
    // 滚动条设置
    scrollbar: {
        verticalScrollbarSize: 6,
    },
    // unicode 高亮
    unicodeHighlight: {
        ambiguousCharacters: false,
    },
    // 禁用建议
    quickSuggestions: {
        other: false,
        comments: false,
        strings: false,
    },
    parameterHints: {
        enabled: false,
    },
    wordBasedSuggestionsOnlySameLanguage: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    tabCompletion: 'off',
    wordBasedSuggestions: 'off',
};

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
            options={options}
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
