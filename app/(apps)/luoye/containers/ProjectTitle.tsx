'use client';
import clsx from 'clsx';
import Link from 'next/link';
import Spacer from '@/components/Spacer';
import { Path } from '@/utils';
import styles from '../styles/home.module.css';
import { PROJECT_ICON, PROJECT_NAME } from '../configs';
import SVG from '../components/SVG';
import { revealSidebar } from '../components/PageLayout';

interface Props {
    className?: string;
    userId?: string | null;
    marginBottom?: number | string;
    owner?: string;
    showInfo?: boolean;
    fold?: boolean;
}

const ProjectTitle = ({ className, userId, marginBottom = 0, owner, fold = false, showInfo = true }: Props) => {
    return (
        <div className={clsx(styles.projectTitle, className)} style={{ marginBottom }}>
            {fold && (
                <span className={clsx(styles.pageFoldIcon)} onClick={revealSidebar}>
                    <SVG.Hamburger />
                </span>
            )}
            <Link className={clsx(styles.pageIcon, !fold && styles.showIcon)} href="/luoye" prefetch={false}>
                {PROJECT_ICON}
            </Link>
            <Link className={styles.pageName} href="/luoye" prefetch={false}>
                {PROJECT_NAME}
            </Link>
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
