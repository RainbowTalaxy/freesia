'use client';
import styles from '../styles/document.module.css';
import { DocType } from '@/app/api/luoye';
import { useRouter } from 'next/navigation';
import { useContext, useRef, useState } from 'react';
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
import { DocContext } from '../doc/[docId]/context';

const MarkdownEditor = dynamic(() => import('../components/Editor/MarkdownEditor'), {
    ssr: false,
});

const Document = () => {
    const router = useRouter();
    const { userId, doc, workspace, setDoc } = useContext(DocContext);
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
            const newDoc = await clientFetch(
                API.luoye.updateDoc(doc.id, {
                    content: text,
                }),
            );
            Toast.cover('保存成功');
        } catch {
            Toast.cover('保存失败');
        }
    };

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
                                            const newDoc = await clientFetch(
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
                                Toast.notify('恢复成功');
                                router.refresh();
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
                    userId={userId!}
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
