'use client';
import API, { clientFetch } from '@/app/api';
import { Doc, Workspace } from '@/app/api/luoye';
import { ReactNode, createContext, useEffect, useState } from 'react';

export const DocContext = createContext<{
    userId: string | null;
    doc: Doc | null;
    workspace: Workspace | null;
    setDoc: (newDoc: Doc, needUpdateWorkspace?: boolean) => void;
    setWorkspace: (newWorkspace: Workspace) => void;
}>({
    userId: null,
    doc: null,
    workspace: null,
    setDoc: () => {},
    setWorkspace: () => {},
});

type Props = {
    userId: string | null;
    doc: Doc | null;
    workspace: Workspace | null;
    children: ReactNode;
};

export const DocContextProvider = ({ userId, doc: _doc, workspace: _workspace, children }: Props) => {
    const [doc, _setDoc] = useState<Doc | null>(_doc);
    const [workspace, setWorkspace] = useState<Workspace | null>(_workspace);

    useEffect(() => {
        _setDoc(_doc);
    }, [_doc]);

    useEffect(() => {
        setWorkspace(_workspace);
    }, [_workspace]);

    return (
        <DocContext.Provider
            value={{
                userId,
                doc,
                workspace,
                setDoc: async (newDoc, needUpdateWorkspace = true) => {
                    _setDoc(newDoc);
                    if (!needUpdateWorkspace) return;
                    const newWorkspace = await clientFetch(API.luoye.workspace(newDoc.workspaces[0]));
                    setWorkspace(newWorkspace);
                },
                setWorkspace,
            }}
        >
            {children}
        </DocContext.Provider>
    );
};
