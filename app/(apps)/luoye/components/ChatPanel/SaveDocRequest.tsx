'use client';
import { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { SaveDocRequestToolCallMessage } from '../../ai/chat/types';
import { DocContext } from '../../doc/[docId]/context';
import { HomeContext } from '../../(home)/context';
import DocForm from '../../containers/DocForm';
import Markdown from '../Markdown';
import SVG from '../SVG';
import API, { clientFetch } from '@/api';
import { Doc, DocType } from '@/api/luoye';
import Toast from '../Notification/Toast';
import styles from './SaveDocRequest.module.css';
import Spacer from '@/components/Spacer';

interface Props {
    tool: SaveDocRequestToolCallMessage;
    sessionId: string | null;
}

function getToolStatus(content: SaveDocRequestToolCallMessage['content']) {
    if (
        content === 'confirmed' ||
        content === 'cancelled' ||
        content === 'pending'
    ) {
        return content;
    }
    return 'pending';
}

const SaveDocRequest = ({ tool, sessionId }: Props) => {
    const { userId: docUserId, workspace, workspaceItems, updateWorkspace } = useContext(DocContext);
    const { userId: homeUserId, allWorkspaces } = useContext(HomeContext);
    const userId = docUserId ?? homeUserId;
    const resolvedWorkspaceItems = workspaceItems ?? allWorkspaces ?? undefined;
    const [status, setStatus] = useState<
        'pending' | 'confirmed' | 'cancelled'
    >(() => getToolStatus(tool.content));
    const [docFormOpen, setDocFormOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        setStatus(getToolStatus(tool.content));
    }, [tool.content]);

    const raw =
        typeof tool.input.input === 'string'
            ? (() => {
                  try {
                      return JSON.parse(tool.input.input) as { title: string; content: string };
                  } catch {
                      return tool.input as { title: string; content: string };
                  }
              })()
            : (tool.input as { title: string; content: string });
    const title = raw.title;
    const content = raw.content;

    const handleAccept = () => {
        setDocFormOpen(true);
    };

    const handleDocFormClose = async (newDoc?: Doc) => {
        if (!newDoc) {
            setDocFormOpen(false);
            return;
        }
        try {
            await clientFetch(API.luoye.updateDoc(newDoc.id, { content }));
            if (sessionId) {
                await clientFetch(API.luoye.ai.chat.confirmSave(sessionId, { confirmed: true, runId: tool.run_id }));
            }
            if (workspace && newDoc.workspaces.includes(workspace.id)) {
                await updateWorkspace(workspace.id);
            }
            setStatus('confirmed');
        } catch (error: any) {
            Toast.notify(error.message);
        }
        setDocFormOpen(false);
    };

    const handleReject = async () => {
        try {
            if (sessionId) {
                await clientFetch(API.luoye.ai.chat.confirmSave(sessionId, { confirmed: false, runId: tool.run_id }));
            }
            setStatus('cancelled');
        } catch (error: any) {
            Toast.notify(error.message);
        }
    };

    return (
        <div className={styles.saveDocRequest}>
            <span className={styles.saveDocLabel}>
                {status === 'pending' && '生成文档'}
                {status === 'confirmed' && '已保存文档'}
                {status === 'cancelled' && '已放弃保存文档'}
            </span>
            <button className={styles.saveDocTitle} onClick={() => setPreviewOpen(true)}>
                《{title}》
            </button>
            <Spacer />
            {status === 'pending' && (
                <>
                    <button className={styles.saveDocAccept} onClick={handleAccept}>
                        接受
                    </button>
                    <button className={styles.saveDocReject} onClick={handleReject}>
                        放弃
                    </button>
                </>
            )}
            {docFormOpen && (
                <DocForm
                    userId={userId ?? ''}
                    workspace={workspace}
                    workspaceItems={resolvedWorkspaceItems}
                    initialName={title}
                    initialDocType={DocType.Markdown}
                    onClose={handleDocFormClose}
                />
            )}
            {previewOpen &&
                createPortal(
                    <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
                        <div className={styles.previewCard} onClick={(e) => e.stopPropagation()}>
                            <button className={styles.previewClose} onClick={() => setPreviewOpen(false)}>
                                <SVG.Close />
                            </button>
                            <div className={styles.previewCardBody}>
                                <Markdown title={title}>{`# ${title}\n\n${content}`}</Markdown>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
};

export default SaveDocRequest;
