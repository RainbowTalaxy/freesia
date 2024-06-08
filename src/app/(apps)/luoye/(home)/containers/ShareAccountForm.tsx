'use client';
import API, { clientFetch } from '@/app/api';
import styles from '../../styles/form.module.css';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast from '../../components/Notification/Toast';
import { Button, Input } from '@/app/components/form';
import { Path } from '@/app/utils';

const SHARE_EXPIRE_TIME = 1;

interface Props {
    userId: string;
    onClose: () => Promise<void>;
}

const ShareAccountForm = ({ userId, onClose }: Props) => {
    const idRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [shareUrl, setShareUrl] = useState<string>('');

    useEffect(() => {
        idRef.current!.value = userId;
    }, [userId]);

    const handleGenerateToken = async () => {
        try {
            if (!idRef.current) return Toast.notify('ID 不能为空');
            if (!passwordRef.current) return Toast.notify('密码不能为空');
            const { token } = await clientFetch(
                API.user.login(idRef.current.value, passwordRef.current.value, SHARE_EXPIRE_TIME),
            );
            setShareUrl(window.location.origin + Path.ofTokenDigest(token, Path.of('/luoye')));
        } catch (error: any) {
            Toast.notify(error.message);
        }
    };

    return createPortal(
        <div className={styles.container}>
            <div className={styles.form}>
                <h2>临时账号共享</h2>
                <p className={styles.formDescription}>生成一个 {SHARE_EXPIRE_TIME} 天有效的账号分享链接</p>
                <div className={styles.formItem}>
                    <label>ID：</label>
                    <Input raf={idRef} />
                </div>
                <div className={styles.formItem}>
                    <label>密码：</label>
                    <Input raf={passwordRef} type="password" />
                </div>
                {shareUrl && (
                    <div className={styles.formItem}>
                        <label>链接：</label>
                        <Input value={shareUrl} />
                    </div>
                )}
                <div className={styles.formItem}>
                    <label></label>
                    <div className={styles.options}>
                        <Button type="primary" onClick={handleGenerateToken}>
                            生成
                        </Button>
                        {shareUrl && (
                            <Button
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(shareUrl);
                                        Toast.notify('已复制到剪贴板');
                                    } catch (error: any) {
                                        Toast.notify('复制失败');
                                    }
                                }}
                            >
                                复制链接
                            </Button>
                        )}
                        <Button onClick={() => onClose()}>取消</Button>
                    </div>
                </div>
            </div>
            <div className={styles.mask} onClick={() => onClose()} />
        </div>,
        document.body,
    );
};

export default ShareAccountForm;
