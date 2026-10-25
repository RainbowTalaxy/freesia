import { RefObject } from 'react';

export interface EditorSelection {
    text: string;
    start: number;
    end: number;
}

export interface EditorSelectionState extends EditorSelection {
    x: number;
    y: number;
}

export interface EditorRef {
    focus: () => void;
    setText: (text: string) => void;
    getText: () => string;
    getSelection: () => EditorSelection | null;
    loaded: () => boolean;
}

export interface EditorProps {
    className?: string;
    defaultValue?: string;
    visible: boolean;
    keyId: string;
    textRef: RefObject<EditorRef>;
    onSave: (text: string) => void;
    onSelectionChange?: (selection: EditorSelectionState | null) => void;
}
