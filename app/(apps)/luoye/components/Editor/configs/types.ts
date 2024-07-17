import { RefObject } from 'react';

export interface EditorRef {
    focus: () => void;
    setText: (text: string) => void;
    getText: () => string;
    loaded: () => boolean;
}

export interface EditorProps {
    className?: string;
    defaultValue?: string;
    visible: boolean;
    keyId: string;
    textRef: RefObject<EditorRef>;
    onSave: (text: string) => void;
}
