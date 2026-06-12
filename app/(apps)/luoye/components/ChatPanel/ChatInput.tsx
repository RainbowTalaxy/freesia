'use client';
/* eslint-disable @next/next/no-img-element */

import { useRef, type ChangeEvent, type DragEvent, type KeyboardEvent, type RefObject } from 'react';
import SVG from '../SVG';
import { Button, TextArea } from '@/components/form';
import type { ChatImageAttachment } from '../../ai/chat/types';
import styles from './ChatPanel.module.css';
import { ATTACHMENT_ACCEPT } from './useChatAttachments';

interface ChatInputProps {
    attachments: ChatImageAttachment[];
    fileInputRef: RefObject<HTMLInputElement>;
    input: string;
    isDraggingAttachment: boolean;
    isLoading: boolean;
    isRestoringSession: boolean;
    isUploadingAttachment: boolean;
    onAbort: () => void;
    onAttachmentChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onAttachmentDragEnter: (event: DragEvent<HTMLElement>) => void;
    onAttachmentDragLeave: (event: DragEvent<HTMLElement>) => void;
    onAttachmentDragOver: (event: DragEvent<HTMLElement>) => void;
    onAttachmentDrop: (event: DragEvent<HTMLElement>) => void;
    onInputChange: (value: string) => void;
    onRemoveAttachment: (id: string) => void;
    onSend: (input: string) => void;
}

export default function ChatInput({
    attachments,
    fileInputRef,
    input,
    isDraggingAttachment,
    isLoading,
    isRestoringSession,
    isUploadingAttachment,
    onAbort,
    onAttachmentChange,
    onAttachmentDragEnter,
    onAttachmentDragLeave,
    onAttachmentDragOver,
    onAttachmentDrop,
    onInputChange,
    onRemoveAttachment,
    onSend,
}: ChatInputProps) {
    const isComposingRef = useRef(false);

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' || event.shiftKey) return;
        if (isComposingRef.current || event.nativeEvent.isComposing) return;
        event.preventDefault();
        onSend(input);
    };

    return (
        <div
            className={`${styles.inputActions} ${
                isDraggingAttachment ? styles.inputActionsDragging : ''
            }`}
            onDragEnter={onAttachmentDragEnter}
            onDragLeave={onAttachmentDragLeave}
            onDragOver={onAttachmentDragOver}
            onDrop={onAttachmentDrop}
        >
            {!!attachments.length && (
                <div className={styles.attachmentPreviewList}>
                    {attachments.map((attachment) => (
                        <div
                            className={styles.attachmentPreview}
                            data-status={attachment.uploadStatus}
                            key={attachment.id}
                        >
                            <img src={attachment.previewUrl || attachment.url} alt={attachment.name} />
                            {attachment.uploadStatus === 'uploading' && (
                                <span className={styles.attachmentPreviewStatus}>
                                    <SVG.Loader />
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => onRemoveAttachment(attachment.id)}
                                aria-label={`移除图片 ${attachment.name}`}
                            >
                                <SVG.Close />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className={styles.inputPanel}>
                <TextArea
                    name="chat-box"
                    className={styles.chatBox}
                    placeholder="请输入你想问的问题（Shift+Enter 换行）"
                    value={input}
                    onChange={(event) => onInputChange(event.target.value)}
                    onCompositionStart={() => (isComposingRef.current = true)}
                    onCompositionEnd={() => (isComposingRef.current = false)}
                    onKeyDown={handleKeyDown}
                />
                <div className={styles.inputActionBar}>
                    <input
                        ref={fileInputRef}
                        className={styles.attachmentInput}
                        type="file"
                        accept={ATTACHMENT_ACCEPT}
                        multiple
                        onChange={onAttachmentChange}
                    />
                    <button
                        className={styles.attachmentButton}
                        type="button"
                        disabled={isUploadingAttachment || attachments.length >= 3}
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="上传图片"
                    >
                        <SVG.ImagePlus />
                    </button>
                    <Button
                        className={styles.sendButton}
                        type="primary"
                        onClick={isLoading ? onAbort : () => onSend(input)}
                    >
                        {isLoading
                            ? '停 止'
                            : isRestoringSession
                              ? '恢复中'
                              : isUploadingAttachment
                                ? '上传中'
                                : '发 送'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
