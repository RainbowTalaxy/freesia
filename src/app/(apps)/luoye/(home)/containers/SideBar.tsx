'use client';
import { useParams, useRouter } from 'next/navigation';
import { SideBarList, SideBarListItem, hideSidebar } from '../../components/SideBar';
import { Scope, WorkspaceItem } from '@/app/api/luoye';
import Placeholder from '../../components/PlaceHolder';
import SVG from '../../components/SVG';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useState } from 'react';
import API, { clientFetch } from '@/app/api';
import { splitWorkspace } from '../../configs';
import Toast from '../../components/Notification/Toast';
import Link from 'next/link';

interface Props {
    userId: string;
    defaultWorkspace: WorkspaceItem;
    workspaces: WorkspaceItem[];
}

const SideBar = ({ userId, defaultWorkspace, workspaces: _workspaces }: Props) => {
    // const router = useRouter();
    const { tab, workspaceId } = useParams<{
        tab?: string;
        workspaceId?: string;
    }>();
    const [workspaces, setWorkspaces] = useState(_workspaces);

    return (
        <>
            <SideBarList>
                <Link href="/luoye">
                    <SideBarListItem active={!workspaceId && !tab} icon="🍄">
                        开始
                    </SideBarListItem>
                </Link>
                <Link href="/luoye/settings">
                    <SideBarListItem active={tab === 'settings'} icon="⚙️">
                        设置
                    </SideBarListItem>
                </Link>
                <Link href={`/luoye/workspace/${defaultWorkspace.id}`}>
                    <SideBarListItem icon="🪴" active={workspaceId === defaultWorkspace.id}>
                        <span>{defaultWorkspace.name || <Placeholder>未命名</Placeholder>}</span>
                        {defaultWorkspace.scope === Scope.Private && <SVG.Lock />}
                    </SideBarListItem>
                </Link>
                <Link href="/luoye/doc-bin">
                    <SideBarListItem active={tab === 'doc-bin'} icon="♻️">
                        文档回收站
                    </SideBarListItem>
                </Link>
            </SideBarList>
            <h2>工作区</h2>
            {workspaces.length === 0 && (
                <SideBarList>
                    <SideBarListItem>
                        <Placeholder>暂无工作区</Placeholder>
                    </SideBarListItem>
                </SideBarList>
            )}
            <DragDropContext
                onDragEnd={async (result) => {
                    const sourceIdx = result.source.index;
                    const destIdx = result.destination?.index ?? -1;
                    if (destIdx < 0 || sourceIdx === destIdx) return;
                    const reOrdered = Array.from(workspaces);
                    const [removed] = reOrdered.splice(sourceIdx, 1);
                    reOrdered.splice(destIdx, 0, removed);
                    // 先更新状态，避免回弹动画
                    setWorkspaces(reOrdered);
                    try {
                        const newWorkspaceItems = await clientFetch(
                            API.luoye.updateWorkspaceItems(
                                reOrdered.map((workspace) => workspace.id).concat(defaultWorkspace.id),
                            ),
                        );
                        setWorkspaces(splitWorkspace(newWorkspaceItems, userId).workspaces);
                    } catch (error: any) {
                        Toast.notify(error.message);
                        setWorkspaces(workspaces);
                    }
                }}
            >
                <Droppable droppableId="droppable">
                    {(provided) => (
                        <SideBarList ref={provided.innerRef} {...provided.droppableProps}>
                            {workspaces.map((workspace, index) => (
                                <Draggable key={workspace.id} draggableId={workspace.id} index={index}>
                                    {(provided) => (
                                        <SideBarListItem
                                            icon="🪴"
                                            ref={provided.innerRef}
                                            active={workspaceId === workspace.id}
                                            // onClick={() => history.push(`?workspace=${workspace.id}`)}
                                            draggableProps={provided.draggableProps}
                                            dragHandleProps={provided.dragHandleProps}
                                            style={provided.draggableProps.style}
                                        >
                                            <span>{workspace.name || <Placeholder>未命名</Placeholder>}</span>
                                            {workspace.scope === Scope.Private && <SVG.Lock />}
                                        </SideBarListItem>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </SideBarList>
                    )}
                </Droppable>
            </DragDropContext>
        </>
    );
};

export default SideBar;
