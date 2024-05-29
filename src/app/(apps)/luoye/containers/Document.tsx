'use client';
import styles from '../styles/document.module.css';
import { Doc, DocType, Workspace } from '@/app/api/luoye';
import { useRouter } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import EditingModeGlobalStyle from '../styles/EditingModeGlobalStyle';
import DocForm from './DocForm';
import dayjs from 'dayjs';
import { checkAuth } from '../configs';
import ProjectTitle from './ProjectTitle';
import Placeholder from '../components/PlaceHolder';
import { Button } from '@/app/components/form';
import clsx from 'clsx';
import Toast from '../components/Notification/Toast';
import API, { clientFetch } from '@/app/api';
import Editor, { EditorRef } from '../components/Editor/Editor';
import Markdown from '../components/Markdown';
import dynamic from 'next/dynamic';

const MarkdownEditor = dynamic(() => import('../components/Editor/MarkdownEditor'), {
    ssr: false,
});

interface Props {
    userId: string;
    data: Doc;
    workspace?: Workspace | null;
}

const Document = ({ userId, data, workspace }: Props) => {
    const router = useRouter();
    const doc = data;
    const [isEditing, setIsEditing] = useState(false);
    const [isDocFormVisible, setDocFormVisible] = useState(false);
    const textRef = useRef<EditorRef>(null);

    const auth = checkAuth(doc, userId);
    const isDeleted = Boolean(doc?.deletedAt);
    const isSidebarVisible = Boolean(workspace) && !isDeleted;

    const onSaveContent = async () => {
        if (!doc) return;
        const text = textRef.current?.getText();
        try {
            await clientFetch(
                API.luoye.updateDoc(doc.id, {
                    content: text,
                }),
            );
            Toast.cover('保存成功');
            router.refresh();
        } catch {
            Toast.cover('保存失败');
        }
    };

    return (
        <div className={styles.docView}>
            {isEditing && <EditingModeGlobalStyle />}
            <header className={styles.docNavBar}>
                {isSidebarVisible ? (
                    <>
                        <div className={styles.docNavTitle}>{doc.name || <Placeholder>未命名文档</Placeholder>}</div>
                        <ProjectTitle className={styles.docIcon} fold={isSidebarVisible} showInfo={false} />
                    </>
                ) : (
                    <ProjectTitle fold={isSidebarVisible} showInfo={false} />
                )}
                {!isDeleted &&
                    (auth.editable ? (
                        <>
                            {!isEditing && <Button onClick={() => setDocFormVisible(true)}>设 置</Button>}
                            <Button
                                type="primary"
                                onClick={async () => {
                                    if (isEditing) {
                                        const text = textRef.current?.getText();
                                        if (doc.content === '' && text === '') return setIsEditing(false);
                                        try {
                                            await clientFetch(
                                                API.luoye.updateDoc(doc.id, {
                                                    content: text,
                                                }),
                                            );
                                            setIsEditing(false);
                                            router.refresh();
                                        } catch (error: any) {
                                            return Toast.notify(error.message);
                                        }
                                    } else {
                                        textRef.current?.setText(doc.content);
                                        setIsEditing(true);
                                    }
                                }}
                            >
                                {isEditing ? '保 存' : '编 辑'}
                            </Button>
                            {isEditing && <Button onClick={() => setIsEditing(false)}>取 消</Button>}
                        </>
                    ) : (
                        doc.creator.toUpperCase()
                    ))}
                {isDeleted && (
                    <Button
                        type="primary"
                        onClick={async () => {
                            try {
                                if (!confirm('确定要恢复该文档吗？')) return;
                                await clientFetch(API.luoye.restoreDoc(doc.id));
                                router.refresh();
                                Toast.notify('恢复成功');
                            } catch (error: any) {
                                Toast.notify(error.message);
                            }
                        }}
                    >
                        恢 复
                    </Button>
                )}
            </header>
            <main
                className={clsx(
                    styles.document,
                    !isSidebarVisible && styles.centeredDoc,
                    !isEditing && styles.hiddenEditor,
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
                            {auth.editable ? (
                                <> 于 {dayjs(doc.updatedAt).format('YYYY年M月D日 H:mm')} 更新</>
                            ) : (
                                <> 落于 {dayjs(doc.date).format('YYYY年M月D日')} </>
                            )}
                            。
                        </p>
                    </>
                )}
                {doc.docType === DocType.Text && (
                    <Editor ref={textRef} textRef={textRef} visible={isEditing} keyId={doc.id} onSave={onSaveContent} />
                )}
                {doc.docType === DocType.Markdown && (
                    <MarkdownEditor
                        textRef={textRef}
                        defaultValue={doc.content}
                        visible={isEditing}
                        keyId={doc.id}
                        onSave={onSaveContent}
                    />
                )}
            </main>
            {isDocFormVisible && (
                <DocForm
                    userId={userId}
                    doc={doc}
                    onClose={async (newDoc) => {
                        if (newDoc) router.refresh();
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
