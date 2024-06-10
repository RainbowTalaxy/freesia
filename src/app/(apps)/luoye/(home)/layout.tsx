import styles from '../styles/home.module.css';
import PageLayout from '../components/PageLayout';
import ProjectTitle from '../containers/ProjectTitle';
import { ReactNode } from 'react';
import SideBar from './containers/SideBar';
import Server, { serverFetch } from '@/app/api/server';
import API from '@/app/api';
import { ContextProvider } from './context';

interface Props {
    children: ReactNode;
}

export default async function Layout({ children }: Props) {
    const userId = await Server.userId();
    const allWorkspaces = await serverFetch(API.luoye.workspaceItems(), true);

    return (
        <ContextProvider userId={userId} allWorkspaces={allWorkspaces}>
            <div className={styles.container}>
                <PageLayout
                    navbar={<ProjectTitle userId={userId} fold />}
                    sidebar={
                        <>
                            <ProjectTitle className={styles.fixedTitle} userId={userId} />
                            <SideBar />
                        </>
                    }
                >
                    <div className={styles.pageView}>{children}</div>
                </PageLayout>
            </div>
        </ContextProvider>
    );
}
