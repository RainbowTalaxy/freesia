'use client';
import { useParams } from 'next/navigation';
import { SideBarList, SideBarListItem } from '../../components/PageLayout';
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
    const { tab, workspaceId } = useParams<{
        tab?: string;
        workspaceId?: string;
    }>();
    const [workspaces, setWorkspaces] = useState(_workspaces);

    return (
        <>
            <SideBarList>
                <SideBarListItem href="/luoye" active={!workspaceId && !tab} icon="🍄">
                    开始
                </SideBarListItem>
                <SideBarListItem href="/luoye/settings" active={tab === 'settings'} icon="⚙️">
                    设置
                </SideBarListItem>
                <SideBarListItem
                    icon="🪴"
                    href={`/luoye/workspace`}
                    active={tab === 'workspace' || workspaceId === defaultWorkspace.id}
                >
                    <span>{defaultWorkspace.name || <Placeholder>未命名</Placeholder>}</span>
                    {defaultWorkspace.scope === Scope.Private && <SVG.Lock />}
                </SideBarListItem>
                <SideBarListItem href="/luoye/doc-bin" active={tab === 'doc-bin'} icon="♻️">
                    文档回收站
                </SideBarListItem>
            </SideBarList>
            <h2>工作区</h2>
            {workspaces.length === 0 && (
                <SideBarList>
                    <SideBarListItem name="暂无工作区">
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
                                            href={`/luoye/workspace/${workspace.id}`}
                                            active={workspaceId === workspace.id}
                                            ref={provided.innerRef}
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
