import styles from '../../styles/home.module.css';
import clsx from 'clsx';
import { ReactNode } from 'react';
import PageLayout from '../../components/PageLayout';
import ProjectTitle from '../../containers/ProjectTitle';
import SideBar from '../containers/Sidebar';
import { fetchDocInfo } from './cache';
import { DocContextProvider } from './context';

interface Props {
    children: ReactNode;
    params: {
        docId: string;
    };
}

export default async function Layout({ children, params }: Props) {
    const { docId } = params;
    const docInfo = await fetchDocInfo(docId);
    const { userId, doc, workspace } = docInfo;

    const isDeleted = Boolean(doc?.deletedAt);
    const isSidebarVisible = Boolean(workspace) && !isDeleted;

    return (
        <DocContextProvider userId={userId} doc={doc} workspace={workspace}>
            <div className={clsx(styles.container)}>
                <PageLayout
                    navbar={<ProjectTitle owner={doc?.creator ?? '404'} fold />}
                    sidebarVisible={isSidebarVisible}
                    sidebar={
                        workspace && (
                            <>
                                <ProjectTitle className={styles.fixedTitle} userId={userId} />
                                <SideBar />
                            </>
                        )
                    }
                >
                    {children}
                </PageLayout>
            </div>
        </DocContextProvider>
    );
}
