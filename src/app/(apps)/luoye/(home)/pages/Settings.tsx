'use client';
import { Button } from '@/app/components/form';
import ShareAccountForm from '../containers/ShareAccountForm';
import styles from '../../styles/home.module.css';
import { useState } from 'react';

export default function Settings() {
    const [isShareAccountFormVisible, setShareAccountFormVisible] = useState(false);

    return (
        <>
            <div className={styles.titleBar}>
                <h2 className={styles.pageTitle}>设置</h2>
            </div>
            <h2>账号设置</h2>
            <Button onClick={() => setShareAccountFormVisible(true)}>临时共享账号</Button>
            {isShareAccountFormVisible && <ShareAccountForm onClose={async () => setShareAccountFormVisible(false)} />}
        </>
    );
}
