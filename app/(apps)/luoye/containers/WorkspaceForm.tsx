'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import API, { clientFetch } from '@/api';
import { Scope, Workspace, WorkspaceItem } from '@/api/luoye';
import { Button, Input, TextArea, Toggle } from '@/components/form';
import { Logger } from '@/utils';
import Toast from '../components/Notification/Toast';
import styles from '../styles/form.module.css';

interface Props {
    userId: string;
    workspace?: WorkspaceItem | Workspace;
    onClose: (newWorkspace?: Workspace) => Promise<void>;
}

const WorkspaceForm = ({ userId, workspace, onClose }: Props) => {
    const nameRef = useRef<HTMLInputElement>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const scopeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (workspace) {
            nameRef.current!.value = workspace.name;
            descriptionRef.current!.value = workspace.description;
            scopeRef.current!.checked = workspace.scope === Scope.Public;
        }
    }, [workspace]);

    const isUserWorkspace = userId && userId === workspace?.id;

    const handleSubmit = async () => {
        if (!nameRef.current!.value) return Toast.notify('请输入标题');
        const props = {
            name: nameRef.current!.value,
            description: descriptionRef.current!.value,
            scope: scopeRef.current!.checked ? Scope.Public : Scope.Private,
        };
        try {
            let newWorkspace: Workspace;
            if (workspace) {
                newWorkspace = await clientFetch(API.luoye.updateWorkspace(workspace.id, props));
            } else {
                newWorkspace = await clientFetch(API.luoye.createWorkspace(props));
            }
            await onClose(newWorkspace);
        } catch (error: any) {
            Logger.error('工作区信息更新失败', error);
            Toast.notify(error.message);
        }
    };

    return createPortal(
        <div className={styles.container}>
            <div className={styles.form}>
                <h2>{workspace ? '工作区属性' : '新建工作区'}</h2>
                <div className={clsx(styles.formItem, isUserWorkspace && styles.hidden)}>
                    <label>
                        <span>*</span>标题：
                    </label>
                    <Input raf={nameRef} />
                </div>
                <div className={clsx(styles.formItem, isUserWorkspace && styles.hidden)}>
                    <label>描述：</label>
                    <TextArea raf={descriptionRef} />
                </div>
                <div className={styles.formItem}>
                    <label>公开：</label>
                    <Toggle raf={scopeRef} />
                </div>
                <div className={styles.formItem}>
                    <label></label>
                    <div className={styles.options}>
                        <Button type="primary" onClick={handleSubmit}>
                            {workspace ? '保存' : '创建'}
                        </Button>
                        <Button onClick={() => onClose()}>取消</Button>
                    </div>
                </div>
            </div>
            <div className={styles.mask} onClick={() => onClose()} />
        </div>,
        document.body,
    );
};

export default WorkspaceForm;
