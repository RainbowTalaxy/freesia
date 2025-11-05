'use client';
import { useContext, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import API, { clientFetch } from '@/api';
import { DocType } from '@/api/luoye';
import { Button } from '@/components/form';
import EditingModeGlobalStyle from '../styles/EditingModeGlobalStyle';
import DocForm from './DocForm';
import { checkAuth } from '../configs';
import ProjectTitle from './ProjectTitle';
import Placeholder from '../components/PlaceHolder';
import Toast from '../components/Notification/Toast';
import Markdown from '../components/Markdown';
import { DocContext } from '../doc/[docId]/context';
import { TextEditor, MarkdownEditor, EditorRef } from '../components/Editor';
import styles from '../styles/document.module.css';

const Document = () => {
    const router = useRouter();
    const { userId, doc, workspace, workspaceItems, isLoading, isEditing, setEditing, updateDoc } =
        useContext(DocContext);

    const [isDocFormVisible, setDocFormVisible] = useState(false);
    const textRef = useRef<EditorRef>(null);

    const docAuth = checkAuth(doc, userId);
    const isDeleted = Boolean(doc?.deletedAt);
    const isSidebarVisible = Boolean(workspace) && !isDeleted;

    const onSaveContent = async () => {
        if (!doc) return;
        const text = textRef.current?.getText();
        try {
            const newDoc = await clientFetch(API.luoye.updateDoc(doc.id, { content: text }));
            Toast.cover('保存成功');
            updateDoc(newDoc, false);
        } catch {
            Toast.cover('保存失败');
        }
    };

    useEffect(() => {
        if (!isEditing) return;
        if (!textRef.current || !textRef.current.loaded()) {
            Toast.notify('正在加载编辑器');
        }
    }, [isEditing]);

    if (isLoading)
        return (
            <div className={styles.docView}>
                <header className={styles.docNavBar}>
                    <div className={styles.docNavTitle}>
                        <Placeholder>加载中...</Placeholder>
                    </div>
                </header>
            </div>
        );

    if (!doc)
        return (
            <div className={styles.docView}>
                <header className={styles.docNavBar}>
                    <ProjectTitle className={styles.docIcon} />
                </header>
                <main className={clsx(styles.document)}>
                    <p>抱歉，文档不存在。</p>
                </main>
            </div>
        );

    const handleClickEditButton = async () => {
        if (isEditing) {
            const text = textRef.current?.getText();
            try {
                const newDoc = await clientFetch(API.luoye.updateDoc(doc.id, { content: text }));
                setEditing(false);
                updateDoc(newDoc, false);
            } catch (error: any) {
                return Toast.notify(error.message);
            }
        } else {
            textRef.current?.setText(doc.content);
            setEditing(true);
        }
    };

    const handleRecover = async () => {
        try {
            if (!confirm('确定要恢复该文档吗？')) return;
            await clientFetch(API.luoye.restoreDoc(doc.id));
            Toast.notify('恢复成功');
            router.refresh();
        } catch (error: any) {
            Toast.notify(error.message);
        }
    };

    const Editor = doc.docType === DocType.Text ? TextEditor : MarkdownEditor;

    return (
        <div className={styles.docView}>
            {isEditing && <EditingModeGlobalStyle />}
            <header className={clsx(styles.docNavBar, styles.hasDoc)}>
                {isSidebarVisible ? (
                    <>
                        <div className={styles.docNavTitle}>{doc.name || <Placeholder>未命名文档</Placeholder>}</div>
                        <ProjectTitle className={clsx(styles.docIcon)} fold={isSidebarVisible} showInfo={false} />
                    </>
                ) : (
                    <ProjectTitle fold={isSidebarVisible} showInfo={false} />
                )}
                {!isDeleted &&
                    (docAuth.editable ? (
                        <>
                            {!isEditing && <Button onClick={() => setDocFormVisible(true)}>设 置</Button>}
                            <Button type="primary" onClick={handleClickEditButton}>
                                {isEditing ? '保 存' : '编 辑'}
                            </Button>
                            {isEditing && <Button onClick={() => setEditing(false)}>取 消</Button>}
                        </>
                    ) : (
                        doc.creator.toUpperCase()
                    ))}
                {isDeleted && (
                    <Button type="primary" onClick={handleRecover}>
                        恢 复
                    </Button>
                )}
            </header>
            <main
                className={clsx(
                    styles.document,
                    !isSidebarVisible && styles.centeredDoc,
                    isEditing ? styles.showEditor : styles.hiddenEditor,
                )}
            >
                {!isEditing && (
                    <>
                        <h1 id={doc.name}>{doc.name || <Placeholder>无标题</Placeholder>}</h1>
                        {doc.docType === DocType.Text &&
                            doc.content.split('\n').map((item, index) => <p key={index}>{item}</p>)}
                        {doc.docType === DocType.Markdown && <Markdown title={doc.name}>{doc.content}</Markdown>}
                        <p className={styles.docInfo}>
                            <span>{doc.creator.toUpperCase()}</span>
                            {docAuth.editable ? (
                                <> 于 {dayjs(doc.updatedAt).format('YYYY年M月D日 H:mm')} 更新</>
                            ) : (
                                <> 落于 {dayjs(doc.date).format('YYYY年M月D日')} </>
                            )}
                            。
                        </p>
                    </>
                )}
                <Editor
                    textRef={textRef}
                    defaultValue={doc.content}
                    visible={isEditing}
                    keyId={doc.id}
                    onSave={onSaveContent}
                />
            </main>
            {isDocFormVisible && (
                <DocForm
                    userId={userId!}
                    workspace={workspace}
                    workspaceItems={workspaceItems ?? undefined}
                    doc={doc}
                    onClose={async (newDoc) => {
                        if (newDoc) updateDoc(newDoc);
                        setDocFormVisible(false);
                    }}
                    onDelete={() => {
                        router.replace(`/luoye/workspace/${doc.workspaces[0]}`);
                    }}
                />
            )}
        </div>
    );
};

export default Document;
