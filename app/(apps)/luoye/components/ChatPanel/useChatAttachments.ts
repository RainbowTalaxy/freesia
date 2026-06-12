'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
    type SetStateAction,
} from 'react';
import API from '@/api';
import type { ChatImageAttachment } from '../../ai/chat/types';
import Toast from '../Notification/Toast';
import { CHAT_PANEL_MOCK } from './mock';

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024;
const COMPRESS_MIN_SIZE = 512 * 1024;
const COMPRESS_MAX_EDGE = 2048;
const COMPRESS_QUALITY = 0.86;
const SUPPORTED_ATTACHMENT_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
];

export const ATTACHMENT_ACCEPT = SUPPORTED_ATTACHMENT_MIME_TYPES.join(',');

interface UploadAttachmentResponse {
    message?: string;
    file?: {
        filename: string;
        originalname: string;
        mimetype: string;
        size: number;
        url: string;
    };
}

function shouldMockAttachmentUpload() {
    // 只在开发环境启用附件上传 mock，避免误影响线上真实上传。
    return (
        process.env.NODE_ENV !== 'production' &&
        CHAT_PANEL_MOCK.attachmentUpload.enabled
    );
}

function shouldMockAttachmentDragging() {
    // 只在开发环境启用拖拽态 mock，用于直接调整拖拽高亮样式。
    return (
        process.env.NODE_ENV !== 'production' &&
        CHAT_PANEL_MOCK.attachmentUpload.dragging
    );
}

function getCompressedFileName(fileName: string, mimeType: string) {
    const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'image';
    return `${baseName}.${extension}`;
}

async function canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number,
) {
    return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, quality);
    });
}

async function compressImageForUpload(file: File) {
    if (file.type === 'image/gif' || file.size < COMPRESS_MIN_SIZE) {
        return file;
    }
    if (typeof createImageBitmap !== 'function') {
        return file;
    }

    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        return file;
    }

    const scale = Math.min(
        1,
        COMPRESS_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
        bitmap.close();
        return file;
    }

    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
    const blob = await canvasToBlob(canvas, outputType, COMPRESS_QUALITY);
    if (!blob || blob.size >= file.size * 0.95) {
        return file;
    }

    return new File([blob], getCompressedFileName(file.name, outputType), {
        type: outputType,
        lastModified: Date.now(),
    });
}

export function useChatAttachments() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachments, setAttachments] = useState<ChatImageAttachment[]>([]);
    const [isUploadingAttachment, setUploadingAttachment] = useState(false);
    const [isDraggingAttachment, setDraggingAttachment] = useState(false);
    const previewUrlsRef = useRef(new Set<string>());
    const dragDepthRef = useRef(0);

    // 释放单个本地预览地址，避免图片移除后 object URL 继续占用内存。
    const revokePreviewUrl = useCallback((previewUrl?: string) => {
        if (!previewUrl || !previewUrlsRef.current.has(previewUrl)) return;
        URL.revokeObjectURL(previewUrl);
        previewUrlsRef.current.delete(previewUrl);
    }, []);

    // 组件卸载或彻底清空附件时，统一释放所有本地预览地址。
    const revokeAllPreviewUrls = useCallback(() => {
        previewUrlsRef.current.forEach((previewUrl) => {
            URL.revokeObjectURL(previewUrl);
        });
        previewUrlsRef.current.clear();
    }, []);

    // 包一层 setState：当附件列表变化时，自动回收已经不再被引用的预览地址。
    const setAttachmentsSafely = useCallback(
        (action: SetStateAction<ChatImageAttachment[]>) => {
            setAttachments((prev) => {
                const next =
                    typeof action === 'function'
                        ? action(prev)
                        : action;
                const nextPreviewUrls = new Set(
                    next.map((item) => item.previewUrl).filter(Boolean),
                );

                prev.forEach((item) => {
                    if (
                        item.previewUrl &&
                        !nextPreviewUrls.has(item.previewUrl)
                    ) {
                        revokePreviewUrl(item.previewUrl);
                    }
                });

                return next;
            });
        },
        [revokePreviewUrl],
    );

    // 支持发送成功后保留预览地址给消息气泡继续展示；普通清空则同步回收资源。
    const clearAttachments = useCallback(
        (options?: { preservePreviews?: boolean; revokeAll?: boolean }) => {
            if (options?.revokeAll) {
                revokeAllPreviewUrls();
                setAttachments([]);
                return;
            }
            if (options?.preservePreviews) {
                setAttachments([]);
                return;
            }
            setAttachmentsSafely([]);
        },
        [revokeAllPreviewUrls, setAttachmentsSafely],
    );

    // 组件卸载时清理所有本地 object URL，兜底防止预览资源泄漏。
    useEffect(() => {
        return () => {
            revokeAllPreviewUrls();
        };
    }, [revokeAllPreviewUrls]);

    // mock 开启时自动插入一张上传中的图片，方便直接调整上传态样式。
    useEffect(() => {
        if (!shouldMockAttachmentUpload()) {
            return;
        }

        setUploadingAttachment(true);
        setAttachmentsSafely((prev) => {
            if (
                prev.some(
                    (item) => item.id === CHAT_PANEL_MOCK.attachmentUpload.id,
                )
            ) {
                return prev;
            }
            const mockAttachment: ChatImageAttachment = {
                id: CHAT_PANEL_MOCK.attachmentUpload.id,
                url: CHAT_PANEL_MOCK.attachmentUpload.previewUrl,
                previewUrl: CHAT_PANEL_MOCK.attachmentUpload.previewUrl,
                name: CHAT_PANEL_MOCK.attachmentUpload.name,
                mimeType: CHAT_PANEL_MOCK.attachmentUpload.mimeType,
                size: CHAT_PANEL_MOCK.attachmentUpload.size,
                uploadStatus: 'uploading',
            };
            return [
                ...prev,
                mockAttachment,
            ].slice(0, MAX_ATTACHMENTS);
        });
    }, [setAttachmentsSafely]);

    // 单文件上传入口：真实环境先按需压缩，再调用后端图片附件接口；mock 环境直接返回假数据。
    const uploadAttachment = useCallback(async (file: File) => {
        if (shouldMockAttachmentUpload()) {
            // mock 开启时不请求后端上传接口，手动选择图片也走本地假数据。
            return {
                id: `mock-${crypto.randomUUID()}`,
                url: CHAT_PANEL_MOCK.attachmentUpload.previewUrl,
                name: file.name || CHAT_PANEL_MOCK.attachmentUpload.name,
                mimeType: file.type || CHAT_PANEL_MOCK.attachmentUpload.mimeType,
                size: file.size || CHAT_PANEL_MOCK.attachmentUpload.size,
                uploadStatus: 'ready',
            } satisfies ChatImageAttachment;
        }

        const uploadFile = await compressImageForUpload(file);
        const formData = new FormData();
        formData.append('file', uploadFile);

        const response = await fetch(API.luoye.ai.chat.uploadAttachment().url, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData,
        });
        const result = (await response.json()) as UploadAttachmentResponse;
        if (!response.ok || !result.file) {
            throw new Error(result?.message || '上传图片失败');
        }

        return {
            id: result.file.filename,
            url: result.file.url,
            name: result.file.originalname,
            mimeType: result.file.mimetype,
            size: result.file.size,
            uploadStatus: 'ready',
        } satisfies ChatImageAttachment;
    }, []);

    // 批量上传入口：先生成本地草稿预览，接口成功后再用服务端返回的附件信息替换草稿。
    const uploadFiles = useCallback(
        async (files: File[]) => {
            if (files.length === 0) return;

            const remaining = MAX_ATTACHMENTS - attachments.length;
            if (remaining <= 0) {
                Toast.notify(`最多只能上传 ${MAX_ATTACHMENTS} 张图片`);
                return;
            }
            if (files.length > remaining) {
                Toast.notify(`最多只能上传 ${MAX_ATTACHMENTS} 张图片`);
            }

            const selectedFiles = files.slice(0, remaining);
            const invalidFile = selectedFiles.find(
                (file) => !SUPPORTED_ATTACHMENT_MIME_TYPES.includes(file.type),
            );
            if (invalidFile) {
                Toast.notify('仅支持 png、jpeg、webp、gif 图片');
                return;
            }
            const oversizedFile = selectedFiles.find((file) => file.size > MAX_ATTACHMENT_SIZE);
            if (oversizedFile) {
                Toast.notify('图片不能超过 50MB');
                return;
            }

            setUploadingAttachment(true);
            const drafts = selectedFiles.map((file) => {
                const previewUrl = URL.createObjectURL(file);
                previewUrlsRef.current.add(previewUrl);
                return {
                    id: `uploading-${crypto.randomUUID()}`,
                    url: previewUrl,
                    previewUrl,
                    name: file.name,
                    mimeType: file.type,
                    size: file.size,
                    uploadStatus: 'uploading' as const,
                };
            });
            setAttachmentsSafely((prev) =>
                [...prev, ...drafts].slice(0, MAX_ATTACHMENTS),
            );

            try {
                await Promise.all(
                    selectedFiles.map(async (file, index) => {
                        const draft = drafts[index];
                        try {
                            const uploaded = await uploadAttachment(file);
                            setAttachmentsSafely((prev) =>
                                prev.map((item) =>
                                    item.id === draft.id
                                        ? {
                                              ...uploaded,
                                              previewUrl: draft.previewUrl,
                                          }
                                        : item,
                                ),
                            );
                        } catch (error) {
                            setAttachmentsSafely((prev) =>
                                prev.filter((item) => item.id !== draft.id),
                            );
                            Toast.notify(
                                error instanceof Error
                                    ? error.message
                                    : '上传图片失败',
                            );
                        }
                    }),
                );
            } catch (error) {
                Toast.notify(error instanceof Error ? error.message : '上传图片失败');
            } finally {
                setUploadingAttachment(false);
            }
        },
        [attachments.length, setAttachmentsSafely, uploadAttachment],
    );

    // 文件选择器变更后立即清空 value，确保用户连续选择同一张图片也能触发 change。
    const handleAttachmentChange = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(event.target.files || []);
            event.target.value = '';
            await uploadFiles(files);
        },
        [uploadFiles],
    );

    // 只响应真正携带文件的拖拽，避免拖文本、链接时误触发输入框高亮。
    const isFileDragEvent = useCallback((event: DragEvent<HTMLElement>) => {
        return Array.from(event.dataTransfer.types).includes('Files');
    }, []);

    // dragenter 会在子元素间移动时重复触发，用深度计数维持稳定的拖拽高亮态。
    const handleAttachmentDragEnter = useCallback(
        (event: DragEvent<HTMLElement>) => {
            if (!isFileDragEvent(event)) return;
            event.preventDefault();
            dragDepthRef.current += 1;
            setDraggingAttachment(true);
        },
        [isFileDragEvent],
    );

    // 阻止浏览器默认打开文件，并提示系统当前拖拽行为是复制上传。
    const handleAttachmentDragOver = useCallback(
        (event: DragEvent<HTMLElement>) => {
            if (!isFileDragEvent(event)) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
        },
        [isFileDragEvent],
    );

    // 只有拖拽完全离开输入区时才取消高亮，避免经过子节点时闪烁。
    const handleAttachmentDragLeave = useCallback(
        (event: DragEvent<HTMLElement>) => {
            if (!isFileDragEvent(event)) return;
            event.preventDefault();
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
            if (dragDepthRef.current === 0) {
                setDraggingAttachment(false);
            }
        },
        [isFileDragEvent],
    );

    // 放下文件后重置拖拽状态，并复用统一的批量上传逻辑。
    const handleAttachmentDrop = useCallback(
        async (event: DragEvent<HTMLElement>) => {
            if (!isFileDragEvent(event)) return;
            event.preventDefault();
            dragDepthRef.current = 0;
            setDraggingAttachment(false);
            await uploadFiles(Array.from(event.dataTransfer.files));
        },
        [isFileDragEvent, uploadFiles],
    );

    // 删除附件时走安全 setter，让对应的本地预览地址能被同步释放。
    const removeAttachment = useCallback((id: string) => {
        setAttachmentsSafely((prev) => prev.filter((item) => item.id !== id));
    }, [setAttachmentsSafely]);

    return {
        attachments,
        clearAttachments,
        fileInputRef,
        handleAttachmentChange,
        handleAttachmentDragEnter,
        handleAttachmentDragLeave,
        handleAttachmentDragOver,
        handleAttachmentDrop,
        isDraggingAttachment:
            isDraggingAttachment || shouldMockAttachmentDragging(),
        isUploadingAttachment,
        removeAttachment,
        setAttachments: setAttachmentsSafely,
    };
}
