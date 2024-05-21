import styles from '../styles/home.module.css';
import type { Metadata, Viewport } from 'next';
import Server, { serverFetch } from '@/app/api/server';
import API from '@/app/api';
import ContentWithSideBar from '../components/SideBar';
import { BASE_PATH } from '@/app/constants';
import ProjectTitle from '../containers/ProjectTitle';
import { DocItem, WorkspaceItem } from '@/app/api/luoye';
import { splitWorkspace } from '../configs';
import { ReactNode } from 'react';
import SideBar from './containers/SideBar';

interface Props {
    children: ReactNode;
}

export default async function Layout({ children }: Props) {
    const userId = await Server.userId();

    let workspaces: WorkspaceItem[] | null = null;
    let recentDocs: DocItem[] | null = null;
    let defaultWorkspace: WorkspaceItem | null = null;
    let allWorkspaces: WorkspaceItem[] | null = null;
    if (userId) {
        const [_workspaces, _recentDocs] = await Promise.all([
            serverFetch(API.luoye.workspaceItems()),
            serverFetch(API.luoye.recentDocs()),
        ]);
        recentDocs = _recentDocs;
        const splitWorkspaces = splitWorkspace(_workspaces, userId);
        defaultWorkspace = splitWorkspaces.defaultWorkspace;
        workspaces = splitWorkspaces.workspaces;
        allWorkspaces = [defaultWorkspace, ...workspaces];
    }

    return (
        <div className={styles.container}>
            <ContentWithSideBar
                navbar={<ProjectTitle userId={userId} fold />}
                sidebar={
                    <>
                        <ProjectTitle className={styles.fixedTitle} userId={userId} />
                        {userId && defaultWorkspace && workspaces && (
                            <SideBar userId={userId} defaultWorkspace={defaultWorkspace} workspaces={workspaces} />
                        )}
                    </>
                }
            >
                <div className={styles.pageView}>{children}</div>
            </ContentWithSideBar>
        </div>
    );
}

export const metadata: Metadata = {
    title: '落页',
    description: '',
    icons: {
        icon: `${BASE_PATH}/luoye.png`,
    },
};

export const viewport: Viewport = {
    themeColor: '#fff8ed',
};
