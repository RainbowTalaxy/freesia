'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import API, { clientFetch } from '@/api';
import { Doc, DocHistoryEntry, DocHistoryResponse } from '@/api/luoye';
import { Button } from '@/components/form';
import Markdown from '../components/Markdown';
import SVG from '../components/SVG';
import Toast from '../components/Notification/Toast';
import styles from './DocHistory.module.css';

interface Props {
    doc: Doc;
    onClose: () => void;
    onRestore: (doc: Doc) => void;
}

const REASON_LABELS: Record<DocHistoryEntry['reason'], string> = {
    save: '保存前内容',
    'edit-start': '编辑前版本',
    restore: '恢复前版本',
    delete: '删除前版本',
    manual: '手动版本',
    ai: 'AI 修改前版本',
};

const DocHistory = ({ doc, onClose, onRestore }: Props) => {
    const [historyState, setHistoryState] = useState<DocHistoryResponse | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState(false);

    const entries = useMemo(() => {
        if (!historyState) return [];
        return [...(historyState.previous ? [historyState.previous] : []), ...historyState.history];
    }, [historyState]);

    const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0];

    useEffect(() => {
        let active = true;
        clientFetch(API.luoye.docHistory(doc.id))
            .then((result) => {
                if (!active) return;
                setHistoryState(result);
                setSelectedId(result.previous?.id ?? result.history[0]?.id ?? null);
            })
            .catch((error: Error) => {
                if (active) Toast.notify(error.message || '获取历史版本失败');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [doc.id]);

    const handleRestore = async () => {
        if (!selected || restoring) return;
        if (!confirm('恢复该版本会先把当前内容保存到历史，确定继续吗？')) return;
        setRestoring(true);
        try {
            const newDoc = await clientFetch(API.luoye.restoreDocHistory(doc.id, selected.id));
            onRestore(newDoc);
        } catch (error) {
            Toast.notify(error instanceof Error ? error.message : '恢复历史版本失败');
        } finally {
            setRestoring(false);
        }
    };

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <section className={styles.panel} onClick={(event) => event.stopPropagation()}>
                <header className={styles.header}>
                    <div>
                        <h2>历史版本</h2>
                        <p>高频保存会合并为“上一版”，长期版本按编辑会话保留。</p>
                    </div>
                    <button className={styles.close} onClick={onClose} aria-label="关闭历史版本">
                        <SVG.Close />
                    </button>
                </header>

                <div className={styles.body}>
                    <aside className={styles.list}>
                        {loading && <div className={styles.state}>加载中...</div>}
                        {!loading && entries.length === 0 && (
                            <div className={styles.state}>暂无历史版本</div>
                        )}
                        {entries.map((entry) => (
                            <button
                                key={entry.id}
                                className={`${styles.item} ${selected?.id === entry.id ? styles.selected : ''}`}
                                onClick={() => setSelectedId(entry.id)}
                            >
                                <span className={styles.itemTitle}>{entry.name || '未命名文档'}</span>
                                <span className={styles.itemMeta}>
                                    {entry.id === 'previous' ? '上一版' : REASON_LABELS[entry.reason]}
                                    {' · '}
                                    {dayjs(entry.id === 'previous' ? entry.savedAt : entry.savedAt).format('MM-DD HH:mm')}
                                </span>
                            </button>
                        ))}
                    </aside>

                    <main className={styles.preview}>
                        {selected ? (
                            <>
                                <div className={styles.previewHeader}>
                                    <div>
                                        <strong>{selected.name || '未命名文档'}</strong>
                                        <span>
                                            {selected.id === 'previous' ? '上一版' : REASON_LABELS[selected.reason]}
                                            {' · '}
                                            {dayjs(selected.savedAt).format('YYYY-MM-DD HH:mm')}
                                            {' · '}
                                            {selected.savedBy.toUpperCase()}
                                        </span>
                                    </div>
                                    <Button type="primary" onClick={handleRestore} disabled={restoring}>
                                        {restoring ? '恢复中...' : '恢复此版本'}
                                    </Button>
                                </div>
                                <div className={styles.previewBody}>
                                    {doc.docType === 'markdown' ? (
                                        <Markdown title={selected.name || '历史版本'}>{selected.content}</Markdown>
                                    ) : (
                                        <pre>{selected.content || '（空文档）'}</pre>
                                    )}
                                </div>
                            </>
                        ) : (
                            !loading && <div className={styles.state}>选择一个版本查看内容</div>
                        )}
                    </main>
                </div>
            </section>
        </div>,
        document.body,
    );
};

export default DocHistory;
