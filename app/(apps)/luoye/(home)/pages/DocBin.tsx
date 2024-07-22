import Server, { serverFetch } from '../../../../api/server';
import Placeholder from '../../components/PlaceHolder';
import styles from '../../styles/home.module.css';
import { DocBinItem } from '../../../../api/luoye';
import API from '../../../../api';
import Spacer from '../../../../components/Spacer';
import { date } from '../../configs';
import Link from 'next/link';

export default async function DocBin() {
    const userId = await Server.userId();

    let docBinItems: DocBinItem[] | null = null;
    if (userId) {
        docBinItems = await serverFetch(API.luoye.docBin());
    }

    return (
        <>
            <div className={styles.titleBar}>
                <h2 className={styles.pageTitle}>文档回收站</h2>
            </div>
            <p className={styles.pageDescription}>删除的文档会在这里显示</p>

            {docBinItems?.length === 0 ? (
                <p>
                    <Placeholder>{userId ? '暂无文档' : '请先登录'}</Placeholder>
                </p>
            ) : (
                <div className={styles.docList}>
                    {docBinItems?.map((doc) => (
                        <Link key={doc.docId} href={`/luoye/doc/${doc.docId}`}>
                            <div className={styles.docItem}>
                                <div className={styles.docName}>
                                    {doc.name || <Placeholder>未命名文档</Placeholder>}
                                </div>
                                <Spacer />
                                <div className={styles.docUser}>{doc.executor}</div>
                                <div className={styles.docDate}>{date(doc.deletedAt)}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </>
    );
}
