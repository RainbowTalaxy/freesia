'use client';
import { useRouter } from 'next/navigation';
import { SideBarList, SideBarListItem } from '../../components/PageLayout';
import { Doc, Scope, Workspace } from '@/app/api/luoye';
import Placeholder from '../../components/PlaceHolder';
import SVG from '../../components/SVG';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useState } from 'react';
import API, { clientFetch } from '@/app/api';
import { checkAuth, workSpaceName } from '../../configs';
import Toast from '../../components/Notification/Toast';
import WorkspaceForm from '../../containers/WorkspaceForm';
import DocForm from '../../containers/DocForm';

interface Props {
    userId: string;
    doc: Doc;
    workspace: Workspace;
}

const SideBar = ({ userId, doc, workspace: _workspace }: Props) => {
    const router = useRouter();

    const [workspace, setWorkspace] = useState(_workspace);
    const [isWorkspaceFormVisible, setWorkspaceFormVisible] = useState(false);
    const [isDocFormVisible, setDocFormVisible] = useState(false);

    const workspaceAuth = checkAuth(workspace, userId);

    return (
        <>
            <h2>
                <span>{workSpaceName(workspace.name)}</span>
                {workspace.scope === Scope.Private && <SVG.Lock />}
            </h2>
            {workspaceAuth.configurable && (
                <>
                    <SideBarList>
                        <SideBarListItem onClick={() => setDocFormVisible(true)}>新建文档</SideBarListItem>
                        <SideBarListItem onClick={() => setWorkspaceFormVisible(true)}>工作区属性</SideBarListItem>
                    </SideBarList>
                    <h2>文档列表</h2>
                </>
            )}
            <DragDropContext
                onDragEnd={async (result) => {
                    const sourceIdx = result.source.index;
                    const destIdx = result.destination?.index ?? -1;
                    if (destIdx < 0 || sourceIdx === destIdx) return;
                    const reOrdered = Array.from(workspace.docs);
                    const [removed] = reOrdered.splice(sourceIdx, 1);
                    reOrdered.splice(destIdx, 0, removed);
                    // 先更新状态，避免回弹动画
                    setWorkspace({
                        ...workspace,
                        docs: reOrdered,
                    });
                    try {
                        const newWorkspace = await clientFetch(
                            API.luoye.updateWorkspace(workspace.id, {
                                docs: reOrdered,
                            }),
                        );
                        setWorkspace(newWorkspace);
                    } catch (error: any) {
                        Toast.notify(error.message);
                        setWorkspace(workspace);
                    }
                }}
            >
                <Droppable droppableId="droppable">
                    {(provided) => (
                        <SideBarList ref={provided.innerRef} {...provided.droppableProps}>
                            {workspace.docs.map((docDir, index) => (
                                <Draggable key={docDir.docId} draggableId={docDir.docId} index={index}>
                                    {(provided) => (
                                        <SideBarListItem
                                            ref={provided.innerRef}
                                            name={docDir.name || '未命名'}
                                            active={docDir.docId === doc.id}
                                            draggableProps={provided.draggableProps}
                                            dragHandleProps={provided.dragHandleProps}
                                            style={provided.draggableProps.style}
                                            href={`/luoye/doc/${docDir.docId}`}
                                        >
                                            <span>{docDir.name || <Placeholder>未命名</Placeholder>}</span>
                                            {docDir.scope === Scope.Private && <SVG.Lock />}
                                        </SideBarListItem>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </SideBarList>
                    )}
                </Droppable>
            </DragDropContext>
            {workspace && isWorkspaceFormVisible && (
                <WorkspaceForm
                    userId={userId}
                    workspace={workspace}
                    onClose={async (newWorkspace) => {
                        if (newWorkspace) setWorkspace(newWorkspace);
                        setWorkspaceFormVisible(false);
                    }}
                />
            )}
            {workspace && workspaceAuth.configurable && isDocFormVisible && (
                <DocForm
                    workspace={workspace}
                    onClose={async (newDoc) => {
                        setDocFormVisible(false);
                        if (newDoc) router.push(`/luoye/doc/${newDoc.id}`);
                    }}
                />
            )}
        </>
    );
};

export default SideBar;
