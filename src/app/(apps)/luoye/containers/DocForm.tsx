import styles from '../styles/form.module.css';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast from '../components/Notification/Toast';
import clsx from 'clsx';
import { Doc, DocType, Scope, Workspace, WorkspaceItem } from '@/app/api/luoye';
import { formDate, time } from '@/app/utils';
import { Button, Input, Select, Toggle } from '@/app/components/form';
import { DOCTYPE_OPTIONS, DOCTYPE_OPTIONS_NAME, workSpaceName } from '../configs';
import API, { clientFetch } from '@/app/api';

interface Props {
    userId: string;
    workspace?: WorkspaceItem | Workspace | null;
    workspaceItems?: WorkspaceItem[];
    doc?: Doc;
    onClose: (newDoc?: Doc) => Promise<void>;
    onDelete?: () => void;
}

const DocForm = ({ userId, workspace, workspaceItems, doc, onClose, onDelete }: Props) => {
    const nameRef = useRef<HTMLInputElement>(null);
    const workspaceRef = useRef<HTMLSelectElement>(null);
    const scopeRef = useRef<HTMLInputElement>(null);
    const dateRef = useRef<HTMLInputElement>(null);
    const [docType, setDocType] = useState<DocType>(DocType.Text);

    const handleSave = async () => {
        const props = {
            name: nameRef.current!.value,
            scope: scopeRef.current!.checked ? Scope.Public : Scope.Private,
            date: time(dateRef.current!.value),
            docType,
        };
        try {
            let newDoc: Doc;
            if (doc) {
                newDoc = await clientFetch(API.luoye.updateDoc(doc.id, props));
            } else {
                const wId = workspaceRef.current?.value ?? workspace?.id;
                if (!wId) return Toast.notify('请选择工作区');
                newDoc = await clientFetch(API.luoye.createDoc(wId, props));
            }
            await onClose(newDoc);
        } catch (error: any) {
            Toast.notify(error.message);
        }
    };

    const handleDelete = async () => {
        if (!confirm('确定要删除吗？')) return;
        try {
            await clientFetch(API.luoye.deleteDoc(doc!.id));
            onDelete!();
        } catch (error: any) {
            Toast.notify(error.message);
        }
    };

    useEffect(() => {
        if (doc) {
            nameRef.current!.value = doc.name;
            scopeRef.current!.checked = doc.scope === Scope.Public;
            dateRef.current!.value = formDate(doc.date);
            setDocType(doc.docType);
        } else if (workspace) {
            scopeRef.current!.checked = workspace.scope === Scope.Public;
        }
    }, [doc, workspace]);

    return createPortal(
        <div className={styles.container}>
            <div className={styles.form}>
                <h2>{doc ? '文档属性' : '新建文档'}</h2>
                {!doc && workspaceItems && (
                    <div className={styles.formItem}>
                        <label>
                            <span>*</span>工作区：
                        </label>
                        <Select
                            raf={workspaceRef}
                            options={workspaceItems.map((w) => ({ label: workSpaceName(w, userId), value: w.id }))}
                            defaultValue={workspace?.id ?? workspaceItems[0].id}
                        />
                    </div>
                )}
                <div className={styles.formItem}>
                    <label>标题：</label>
                    <Input raf={nameRef} />
                </div>
                <div className={styles.formItem}>
                    <label>日期：</label>
                    <Input raf={dateRef} type="date" defaultValue={formDate()} />
                </div>
                {!doc && (
                    <div className={styles.formItem}>
                        <label>类型：</label>
                        <div className={styles.options}>
                            {DOCTYPE_OPTIONS.map((t) => (
                                <div
                                    key={t}
                                    className={clsx(styles.option, t === docType && styles.selected)}
                                    onClick={() => setDocType(t)}
                                >
                                    {DOCTYPE_OPTIONS_NAME[t]}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className={styles.formItem}>
                    <label>公开：</label>
                    <Toggle raf={scopeRef} />
                </div>
                <div className={styles.formItem}>
                    <label></label>
                    <div className={styles.options}>
                        <Button type="primary" onClick={handleSave}>
                            {doc ? '保 存' : '创 建'}
                        </Button>
                        <Button onClick={() => onClose()}>取 消</Button>
                        {doc && onDelete && (
                            <Button type="danger" onClick={handleDelete}>
                                删 除
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className={styles.mask} onClick={() => onClose()} />
        </div>,
        document.body,
    );
};

export default DocForm;
