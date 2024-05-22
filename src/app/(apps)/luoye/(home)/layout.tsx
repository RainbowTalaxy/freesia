import styles from '../styles/home.module.css';
import PageLayout from '../components/PageLayout';
import ProjectTitle from '../containers/ProjectTitle';
import { ReactNode } from 'react';
import SideBar from './containers/SideBar';
import { fetchHomeInfo } from './cache';

interface Props {
    children: ReactNode;
}

export default async function Layout({ children }: Props) {
    const homeInfo = await fetchHomeInfo();

    return (
        <div className={styles.container}>
            <PageLayout
                navbar={<ProjectTitle userId={homeInfo?.userId} fold />}
                sidebar={
                    <>
                        <ProjectTitle className={styles.fixedTitle} userId={homeInfo?.userId} />
                        {homeInfo && (
                            <SideBar
                                userId={homeInfo.userId}
                                defaultWorkspace={homeInfo.defaultWorkspace}
                                workspaces={homeInfo.workspaces}
                            />
                        )}
                    </>
                }
            >
                <div className={styles.pageView}>{children}</div>
            </PageLayout>
        </div>
    );
}
