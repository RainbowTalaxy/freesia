'use client';

import { EditorSelectionState } from './configs/types';
import styles from './SelectionChatButton.module.css';

interface Props {
    selection: EditorSelectionState | null;
    onClick: () => void;
}

const SelectionChatButton = ({ selection, onClick }: Props) => {
    if (!selection) return null;

    const left = Math.min(Math.max(selection.x, 80), window.innerWidth - 120);
    const top = Math.max(52, selection.y);

    return (
        <button
            type="button"
            className={styles.button}
            style={{ left, top }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
        >
            ＋ 添加到聊天
        </button>
    );
};

export default SelectionChatButton;
