'use client';
import styles from '../../styles/home.module.css';
import { MouseEvent, useContext, useState } from 'react';
import clsx from 'clsx';
import { DocItem, Scope } from '@/app/api/luoye';
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
import { useHomeContext } from '../context';

interface Props {
    userId: string;
    recentDocs: DocItem[];
}

const WORKSPACE_FOLD_THRESHOLD = 7;

const Welcome = ({ userId, recentDocs }: Props) => {
    const router = useRouter();

    const userWorkspace = useHomeContext((state) => state.userWorkspace);
    const workspaces = useHomeContext((state) => state.workspaces);
    const refreshContext = useHomeContext((state) => state.refreshContext);

    const [isWorkspaceListFolded, setWorkspaceListFolded] = useState(true);
    const [isWorkspaceFormVisible, setWorkspaceFormVisible] = useState(false);
    const [isDocFormVisible, setDocFormVisible] = useState(false);

    if (!workspaces || !userWorkspace) return null;

    const allWorkspaces = [userWorkspace, ...workspaces];

    const foldedWorkspaces = isWorkspaceListFolded ? allWorkspaces.slice(0, WORKSPACE_FOLD_THRESHOLD) : allWorkspaces;
    const isWorkspaceFolderVisible = isWorkspaceListFolded && allWorkspaces.length > WORKSPACE_FOLD_THRESHOLD + 1;

    const handleDeleteRecentDoc = async (e: MouseEvent, doc: DocItem) => {
        e.stopPropagation();
        e.preventDefault();
        const granted = confirm('确定删除该记录吗？');
        if (!granted) return;
        try {
            await clientFetch(API.luoye.deleteRecentDoc(doc.id));
            Toast.notify('删除成功');
            router.refresh();
        } catch {
            Toast.notify('删除失败');
        }
    };

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
                    <a
                        className={clsx(styles.workspaceItem, styles.workspaceFolder)}
                        onClick={() => setWorkspaceListFolded(false)}
                    >
                        <div className={styles.workspaceName}>
                            <span>🌳</span>
                            <div>展开更多</div>
                        </div>
                    </a>
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
                            <div className={styles.docAction} onClick={(e) => handleDeleteRecentDoc(e, doc)}>
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
                        if (newWorkspace) {
                            router.push(`/luoye/workspace/${newWorkspace.id}`);
                            refreshContext();
                        }
                        setWorkspaceFormVisible(false);
                    }}
                />
            )}
            {isDocFormVisible && (
                <DocForm
                    userId={userId}
                    workspace={userWorkspace}
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
