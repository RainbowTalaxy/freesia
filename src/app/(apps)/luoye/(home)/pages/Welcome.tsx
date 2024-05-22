'use client';
import styles from '../../styles/home.module.css';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { DocItem, Scope, WorkspaceItem } from '@/app/api/luoye';
import Placeholder from '../../components/PlaceHolder';
import SVG from '../../components/SVG';
import Spacer from '@/app/components/Spacer';
import { date } from '../../configs';
import API, { clientFetch } from '@/app/api';
import Toast from '../../components/Notification/Toast';
import WorkspaceForm from '../../containers/WorkspaceForm';
import DocForm from '../../containers/DocForm';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
    userId: string;
    defaultWorkspace: WorkspaceItem;
    workspaces: WorkspaceItem[];
    recentDocs: DocItem[];
}

const WORKSPACE_FOLD_THRESHOLD = 7;

const Welcome = ({ userId, defaultWorkspace, workspaces, recentDocs }: Props) => {
    const router = useRouter();

    const allWorkspaces = useMemo(() => {
        return [defaultWorkspace, ...workspaces];
    }, [defaultWorkspace, workspaces]);

    const [isWorkspaceListFolded, setWorkspaceListFolded] = useState(true);
    const [isWorkspaceFormVisible, setWorkspaceFormVisible] = useState(false);
    const [isDocFormVisible, setDocFormVisible] = useState(false);

    const foldedWorkspaces = useMemo(() => {
        return isWorkspaceListFolded ? allWorkspaces?.slice(0, WORKSPACE_FOLD_THRESHOLD) : allWorkspaces;
    }, [allWorkspaces, isWorkspaceListFolded]);

    const isWorkspaceFolderVisible = isWorkspaceListFolded && allWorkspaces.length > WORKSPACE_FOLD_THRESHOLD + 1;

    return (
        <>
            <div className={styles.titleBar}>
                <h2 className={styles.pageTitle}>开始</h2>
            </div>
            <div className={styles.actionSheet}>
                <div className={styles.action} onClick={() => setWorkspaceFormVisible(true)}>
                    <span>🪸</span>新建工作区
                </div>
                <div className={styles.action} onClick={() => setDocFormVisible(true)}>
                    <span>🍂</span>新建文档
                </div>
            </div>
            <h2 className={styles.header}>工作区</h2>
            <div className={styles.workspaceList}>
                {foldedWorkspaces.map((workspace) => (
                    <Link className={styles.workspaceItem} key={workspace.id} href={`/luoye/workspace/${workspace.id}`}>
                        <div className={styles.workspaceName}>
                            <span>🪴</span>
                            <div>{workspace.name || <Placeholder>未命名</Placeholder>}</div>
                            {workspace.scope === Scope.Private && <SVG.Lock />}
                        </div>
                        <div className={styles.description}>
                            {workspace.description || <Placeholder>暂无描述</Placeholder>}
                        </div>
                    </Link>
                ))}
                {isWorkspaceFolderVisible && (
                    <div
                        className={clsx(styles.workspaceItem, styles.workspaceFolder)}
                        onClick={() => setWorkspaceListFolded(false)}
                    >
                        <div className={styles.workspaceName}>
                            <span>🌳</span>
                            <div>展开更多</div>
                        </div>
                    </div>
                )}
            </div>
            <h2 className={styles.header}>最近文档</h2>
            {recentDocs.length === 0 ? (
                <p>
                    <Placeholder>暂无文档</Placeholder>
                </p>
            ) : (
                <div className={styles.docList}>
                    {recentDocs.map((doc) => (
                        <Link className={styles.docItem} key={doc.id} href={`/luoye/doc/${doc.id}`}>
                            <div className={styles.docName}>{doc.name || <Placeholder>未命名文档</Placeholder>}</div>
                            {doc.scope === Scope.Private && <SVG.Lock />}
                            <Spacer />
                            <div className={styles.docUser}>{doc.creator}</div>
                            <div className={styles.docDate}>{date(doc.updatedAt)}</div>
                            <div
                                className={styles.docAction}
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    const granted = confirm('确定删除该记录吗？');
                                    if (!granted) return;
                                    try {
                                        await clientFetch(API.luoye.deleteRecentDoc(doc.id));
                                        // await refetch();
                                        Toast.notify('删除成功');
                                    } catch {
                                        Toast.notify('删除失败');
                                    }
                                }}
                            >
                                删除
                            </div>
                        </Link>
                    ))}
                </div>
            )}
            {userId && isWorkspaceFormVisible && (
                <WorkspaceForm
                    userId={userId}
                    onClose={async (newWorkspace) => {
                        if (newWorkspace) router.refresh();
                        setWorkspaceFormVisible(false);
                    }}
                />
            )}
            {isDocFormVisible && (
                <DocForm
                    workspace={defaultWorkspace}
                    workspaceItems={allWorkspaces}
                    onClose={async (newDoc) => {
                        if (newDoc) router.push(`/luoye/doc/${newDoc.id}`);
                        setDocFormVisible(false);
                    }}
                />
            )}
        </>
    );
};

export default Welcome;
