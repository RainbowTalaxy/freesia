'use client';

import * as monaco from 'monaco-editor';
import { DiffEditor, loader } from '@monaco-editor/react';
import styles from './DocumentDiff.module.css';

loader.config({ monaco });

monaco.editor.defineTheme('luoye-diff', {
    base: 'vs',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '9b8566' },
        { token: 'keyword', foreground: '785617' },
        { token: 'string', foreground: '6d794e' },
    ],
    colors: {
        'editor.background': '#fffcf6',
        'editor.foreground': '#5f4a2a',
        'editorLineNumber.foreground': '#c8a66c',
        'editorLineNumber.activeForeground': '#785617',
        'editorGutter.background': '#fff8ed',
        'editor.lineHighlightBackground': 'rgba(255, 237, 204, 0.35)',
        'editor.selectionBackground': 'rgba(208, 157, 62, 0.28)',
        'editor.inactiveSelectionBackground': 'rgba(208, 157, 62, 0.16)',
        'diffEditor.insertedLineBackground': '#eef5e9',
        'diffEditor.insertedTextBackground': '#c5dfbc',
        'diffEditor.insertedTextBorder': '#00000000',
        'diffEditor.removedLineBackground': '#faeee9',
        'diffEditor.removedTextBackground': '#efc5bb',
        'diffEditor.removedTextBorder': '#00000000',
        'diffEditor.diagonalFill': '#f4e6cf',
        'diffEditor.border': '#efd5a3',
        'diffEditorGutter.insertedLineBackground': '#dcebd5',
        'diffEditorGutter.removedLineBackground': '#f2d9d2',
        'diffEditorOverview.insertedForeground': '#91b384',
        'diffEditorOverview.removedForeground': '#cf9083',
        'diffEditor.unchangedCodeBackground': '#fffcf6',
        'editorWidget.background': '#fffcf6',
        'editorWidget.border': '#efd5a3',
        'editorSuggestWidget.background': '#fffcf6',
        'editorSuggestWidget.border': '#efd5a3',
        'scrollbarSlider.background': 'rgba(208, 157, 62, 0.25)',
        'scrollbarSlider.hoverBackground': 'rgba(208, 157, 62, 0.38)',
        'scrollbarSlider.activeBackground': 'rgba(208, 157, 62, 0.5)',
    },
});

interface Props {
    original: string;
    modified: string;
    language: 'markdown' | 'plaintext';
}

const DocumentDiff = ({ original, modified, language }: Props) => {
    return (
        <section className={styles.container}>
            <div className={styles.diffBody}>
                <DiffEditor
                    height="100%"
                    language={language}
                    original={original}
                    modified={modified}
                    theme="luoye-diff"
                    options={{
                        readOnly: true,
                        originalEditable: false,
                        renderSideBySide: true,
                        renderIndicators: true,
                        useInlineViewWhenSpaceIsLimited: true,
                        hideUnchangedRegions: {
                            enabled: true,
                            contextLineCount: 3,
                            minimumLineCount: 6,
                        },
                        minimap: { enabled: false },
                        folding: false,
                        guides: { indentation: false },
                        unicodeHighlight: {
                            nonBasicASCII: false,
                            ambiguousCharacters: false,
                            invisibleCharacters: false,
                            includeComments: false,
                            includeStrings: false,
                        },
                        overviewRulerLanes: 0,
                        renderLineHighlight: 'none',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                        padding: { top: 12, bottom: 12 },
                        lineNumbersMinChars: 3,
                        scrollbar: {
                            verticalScrollbarSize: 8,
                            horizontalScrollbarSize: 8,
                        },
                    }}
                />
            </div>
        </section>
    );
};

export default DocumentDiff;
