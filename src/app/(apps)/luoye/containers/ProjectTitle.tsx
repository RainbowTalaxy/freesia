'use client';
import styles from '../styles/home.module.css';
import { PROJECT_ICON, PROJECT_NAME } from '../configs';
import clsx from 'clsx';
import SVG from '../components/SVG';
import { revealSidebar } from '../components/SideBar';
import { useRouter } from 'next/navigation';
import Spacer from '@/app/components/Spacer';
import { Path } from '@/app/utils';

interface Props {
    className?: string;
    userId?: string | null;
    marginBottom?: number | string;
    owner?: string;
    showInfo?: boolean;
    fold?: boolean;
    navigatePreCheck?: () => boolean;
}

const ProjectTitle = ({
    className,
    userId,
    marginBottom = 0,
    owner,
    fold = false,
    showInfo = true,
    navigatePreCheck,
}: Props) => {
    const router = useRouter();

    const backToHome = () => {
        if (navigatePreCheck && !navigatePreCheck()) return;
        router.push('/luoye');
    };

    return (
        <div className={clsx(styles.projectTitle, className)} style={{ marginBottom }}>
            {fold && (
                <span className={clsx(styles.pageFoldIcon)} onClick={revealSidebar}>
                    <SVG.Hamburger />
                </span>
            )}
            <span className={clsx(styles.pageIcon, !fold && styles.showIcon)} onClick={backToHome}>
                {PROJECT_ICON}
            </span>
            <h1 className={styles.pageName} onClick={backToHome}>
                {PROJECT_NAME}
            </h1>
            <Spacer />
            {showInfo && (
                <span
                    className={styles.pageUser}
                    onClick={() => {
                        if (!owner) Path.toUserConfig();
                    }}
                >
                    {(owner ?? userId)?.toUpperCase() || '登 录'}
                </span>
            )}
        </div>
    );
};

export default ProjectTitle;
