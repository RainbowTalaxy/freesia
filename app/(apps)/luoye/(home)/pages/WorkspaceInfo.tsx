'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scope, type Workspace as WorkspaceInfo } from '@/api/luoye';
import Spacer from '@/components/Spacer';
import { Button } from '@/components/form';
import styles from '../../styles/home.module.css';
import { DEFAULT_WORKSPACE_PLACEHOLDER, date, workSpaceName } from '../../configs';
import Placeholder from '../../components/PlaceHolder';
import SVG from '../../components/SVG';
import DocForm from '../../containers/DocForm';
import WorkspaceForm from '../../containers/WorkspaceForm';

interface Props {
    userId: string;
    data: WorkspaceInfo;
}

const WorkspaceInfo = ({ userId, data }: Props) => {
    const router = useRouter();
    const [isDocFormVisible, setDocFormVisible] = useState(false);
    const [isWorkspaceFormVisible, setWorkspaceFormVisible] = useState(false);

    return (
        <>
            <div className={styles.titleBar}>
                <h2 className={styles.pageTitle}>{workSpaceName(data, userId)}</h2>
                <span className={styles.settings} onClick={() => setWorkspaceFormVisible(true)}>
                    设置
                </span>
            </div>
            <p className={styles.pageDescription}>
                {userId === data.id ? DEFAULT_WORKSPACE_PLACEHOLDER.description : data.description}
            </p>
            <h2 className={styles.docTitleBar}>
                文档列表
                <Spacer />
                <Button type="primary" onClick={() => setDocFormVisible(true)}>
                    新建文档
                </Button>
            </h2>
            <div className={styles.docList}>
                {data.docs.length === 0 ? (
                    <div className={styles.docItem}>
                        <Placeholder>暂无文档</Placeholder>
                    </div>
                ) : (
                    data.docs.map((docDir) => (
                        <Link className={styles.docItem} key={docDir.docId} href={`/luoye/doc/${docDir.docId}`}>
                            <div className={styles.docName}>{docDir.name || <Placeholder>未命名文档</Placeholder>}</div>
                            {docDir.scope === Scope.Private && <SVG.Lock />}
                            <Spacer />
                            <div className={styles.docDate}>{date(docDir.updatedAt)}</div>
                        </Link>
                    ))
                )}
            </div>
            {isDocFormVisible && (
                <DocForm
                    userId={userId}
                    workspace={data}
                    onClose={async (newDoc) => {
                        if (newDoc) router.push(`/luoye/doc/${newDoc.id}`);
                        setDocFormVisible(false);
                    }}
                />
            )}
            {isWorkspaceFormVisible && (
                <WorkspaceForm
                    userId={userId}
                    workspace={data}
                    onClose={async (newWorkspace) => {
                        if (newWorkspace) router.refresh();
                        setWorkspaceFormVisible(false);
                    }}
                />
            )}
        </>
    );
};

export default WorkspaceInfo;
