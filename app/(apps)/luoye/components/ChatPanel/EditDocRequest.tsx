'use client';

import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import API, { clientFetch } from '@/api';
import { Button } from '@/components/form';
import { DocType } from '@/api/luoye';
import {
    EditDocRequestToolCallMessage,
    EditDocRequestToolInput,
} from '../../ai/chat/types';
import { DocContext } from '../../doc/[docId]/context';
import SVG from '../SVG';
import Toast from '../Notification/Toast';
import styles from './EditDocRequest.module.css';
import DocumentDiff from './DocumentDiff';
import { parseEditDocRequestInput } from './editDocRequestInput';

interface Props {
    tool: EditDocRequestToolCallMessage;
    sessionId: string | null;
}

function getToolStatus(content: EditDocRequestToolCallMessage['content']) {
    if (
        content === 'confirmed' ||
        content === 'cancelled' ||
        content === 'pending'
    ) {
        return content;
    }
    return 'pending';
}

const EditDocRequest = ({ tool, sessionId }: Props) => {
    const { doc, updateDoc } = useContext(DocContext);
    const [status, setStatus] = useState(() => getToolStatus(tool.content));
    const [previewOpen, setPreviewOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [conflict, setConflict] = useState(false);
    const input = parseEditDocRequestInput(tool);

    useEffect(() => {
        setStatus(getToolStatus(tool.content));
    }, [tool.content]);

    if (!input) {
        return <div className={styles.editDocRequest}>文档修改请求格式错误</div>;
    }

    const updateToolStatus = async (nextStatus: 'confirmed' | 'cancelled') => {
        if (!sessionId) return;
        await clientFetch(
            API.luoye.ai.chat.confirmSave(sessionId, {
                confirmed: nextStatus === 'confirmed',
                runId: tool.run_id,
            }),
        );
    };

    const handleAccept = async () => {
        if (submitting || conflict || status !== 'pending') return;
        setSubmitting(true);
        try {
            const newDoc = await clientFetch(
                API.luoye.updateDoc(input.docId, {
                    content: input.content,
                    baseUpdatedAt: input.baseUpdatedAt,
                    changeSource: 'ai',
                }),
            );
            updateDoc(newDoc, false);
            try {
                await updateToolStatus('confirmed');
                setStatus('confirmed');
            } catch {
                Toast.notify('文档已保存，但请求状态更新失败');
                setStatus('confirmed');
            }
            setPreviewOpen(false);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : '应用修改失败';
            if (message.includes('文档已被修改')) setConflict(true);
            Toast.notify(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (submitting || status !== 'pending') return;
        setSubmitting(true);
        try {
            await updateToolStatus('cancelled');
            setStatus('cancelled');
            setPreviewOpen(false);
        } catch (error) {
            Toast.notify(
                error instanceof Error ? error.message : '放弃修改失败',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.editDocRequest}>
            <span className={styles.editDocLabel}>
                {status === 'pending' && '修改文档'}
                {status === 'confirmed' && '已应用修改'}
                {status === 'cancelled' && '已放弃修改'}
            </span>
            <button
                className={styles.editDocTitle}
                onClick={() => setPreviewOpen(true)}
            >
                {input.summary || '查看修改建议'}
            </button>
            {conflict && (
                <span className={styles.conflict}>文档已被修改</span>
            )}
            {status === 'pending' && (
                <>
                    <button
                        className={styles.editDocAccept}
                        onClick={handleAccept}
                        disabled={submitting || conflict}
                    >
                        {submitting ? '处理中...' : '接受'}
                    </button>
                    <button
                        className={styles.editDocReject}
                        onClick={handleReject}
                        disabled={submitting}
                    >
                        放弃
                    </button>
                </>
            )}
            {previewOpen &&
                createPortal(
                    <div
                        className={styles.previewOverlay}
                        onClick={() => setPreviewOpen(false)}
                    >
                        <div
                            className={styles.previewCard}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <header className={styles.previewHeader}>
                                <div>
                                    <h2>文档修改预览</h2>
                                    <p>{input.summary || '请确认 AI 的修改内容'}</p>
                                </div>
                                <button
                                    className={styles.previewClose}
                                    onClick={() => setPreviewOpen(false)}
                                    aria-label="关闭修改预览"
                                >
                                    <SVG.Close />
                                </button>
                            </header>
                            <div className={styles.diffContainer}>
                                <DocumentDiff
                                    original={doc?.content ?? ''}
                                    modified={input.content}
                                    language={
                                        doc?.docType === DocType.Markdown
                                            ? 'markdown'
                                            : 'plaintext'
                                    }
                                />
                            </div>
                            {status === 'pending' && (
                                <footer className={styles.previewFooter}>
                                    {conflict && (
                                        <span>
                                            文档已被修改，建议重新发起改稿，避免覆盖新内容。
                                        </span>
                                    )}
                                    <Button
                                        type="primary"
                                        onClick={handleAccept}
                                        disabled={submitting || conflict}
                                    >
                                        {submitting ? '处理中...' : '接受修改'}
                                    </Button>
                                    <Button
                                        onClick={handleReject}
                                        disabled={submitting}
                                    >
                                        放弃
                                    </Button>
                                </footer>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
};

export default EditDocRequest;
