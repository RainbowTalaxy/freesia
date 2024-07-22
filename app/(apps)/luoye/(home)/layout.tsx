import { ReactNode } from 'react';
import API from '@/api';
import Server, { serverFetch } from '@/api/server';
import styles from '../styles/home.module.css';
import PageLayout from '../components/PageLayout';
import ProjectTitle from '../containers/ProjectTitle';
import SideBar from './containers/SideBar';
import { HomeContextProvider } from './context';

interface Props {
    children: ReactNode;
}

export default async function Layout({ children }: Props) {
    const userId = await Server.userId();
    const allWorkspaces = await serverFetch(API.luoye.workspaceItems(), true);

    return (
        <HomeContextProvider userId={userId} allWorkspaces={allWorkspaces}>
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
        </HomeContextProvider>
    );
}
