import { cache } from 'react';
import API from '@/api';
import Server, { serverFetch } from '@/api/server';

export const fetchDocInfo = cache(async (id: string) => {
    const [userId, doc] = await Promise.all([Server.userId(), serverFetch(API.luoye.doc(id), true)]);
    if (doc) {
        const workspace = await serverFetch(API.luoye.workspace(doc.workspaces[0]), true);
        return { userId: userId!, doc, workspace };
    }
    return { userId, doc: null, workspace: null };
});
