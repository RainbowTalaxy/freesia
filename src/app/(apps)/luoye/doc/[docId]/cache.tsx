import { cache } from 'react';
import Server, { serverFetch } from '@/app/api/server';
import API from '@/app/api';

export const fetchDocInfo = cache(async (id: string) => {
    const [userId, doc] = await Promise.all([Server.userId(), serverFetch(API.luoye.doc(id), false)]);
    if (doc) {
        const workspace = await serverFetch(API.luoye.workspace(doc.workspaces[0]), false);
        return { userId: userId!, doc, workspace };
    }
    return { userId, doc: null, workspace: null };
});
