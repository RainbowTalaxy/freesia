import styles from '../styles/form.module.css';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Toast from '../components/Notification/Toast';
import { Scope, Workspace, WorkspaceItem } from '@/app/api/luoye';
import { Button, Input, TextArea, Toggle } from '@/app/components/form';
import API, { clientFetch } from '@/app/api';

interface Props {
    userId: string;
    workspace?: Omit<WorkspaceItem, 'joinAt'>;
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

    const isDefaultWorkspace = userId && userId === workspace?.id;

    return createPortal(
        <div className={styles.container}>
            <div className={styles.form}>
                <h2>{workspace ? '工作区属性' : '新建工作区'}</h2>
                <div className={clsx(styles.formItem, isDefaultWorkspace && styles.hidden)}>
                    <label>
                        <span>*</span>标题：
                    </label>
                    <Input raf={nameRef} />
                </div>
                <div className={clsx(styles.formItem, isDefaultWorkspace && styles.hidden)}>
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
                        <Button
                            type="primary"
                            onClick={async () => {
                                if (!nameRef.current!.value) return Toast.notify('请输入标题');
                                const props = {
                                    name: nameRef.current!.value,
                                    description: descriptionRef.current!.value,
                                    scope: scopeRef.current!.checked ? Scope.Public : Scope.Private,
                                };
                                try {
                                    let newWorkspace: Workspace;
                                    if (workspace) {
                                        newWorkspace = await clientFetch(
                                            API.luoye.updateWorkspace(workspace.id, props),
                                        );
                                    } else {
                                        newWorkspace = await clientFetch(API.luoye.createWorkspace(props));
                                    }
                                    await onClose(newWorkspace);
                                } catch (error: any) {
                                    Toast.notify(error.message);
                                }
                            }}
                        >
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
