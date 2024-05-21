import styles from '../styles/home.module.css';
import type { Metadata, Viewport } from 'next';
import ContentWithSideBar from '../components/SideBar';
import { BASE_PATH } from '@/app/constants';
import ProjectTitle from '../containers/ProjectTitle';
import { ReactNode } from 'react';
import SideBar from './containers/SideBar';
import { fetchHomeInfo } from './page';

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

interface Props {
    children: ReactNode;
}

export default async function Layout({ children }: Props) {
    const homeInfo = await fetchHomeInfo();

    return (
        <div className={styles.container}>
            <ContentWithSideBar
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
            </ContentWithSideBar>
        </div>
    );
}
