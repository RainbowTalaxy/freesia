'use client';
import { useRouter } from 'next/navigation';
import { SideBarList, SideBarListItem, hideSidebar } from '../../components/SideBar';
import { Scope, WorkspaceItem } from '@/app/api/luoye';
import Placeholder from '../../components/PlaceHolder';
import SVG from '../../components/SVG';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useState } from 'react';
import API from '@/app/api';
import clientFetch from '@/app/api/fetch/client';
import { splitWorkspace } from '../../configs';
import Toast from '../../components/Notification/Toast';

enum Tab {
    DocBin = 'doc-bin',
    Settings = 'settings',
}

interface Props {
    userId: string;
    workspaceId?: string;
    tab?: string;
    defaultWorkspace: WorkspaceItem;
    workspaces: WorkspaceItem[];
}

const SideBar = ({ userId, workspaceId, tab, defaultWorkspace, workspaces: _workspaces }: Props) => {
    // const router = useRouter();
    const [workspaces, setWorkspaces] = useState(_workspaces);

    return (
        <>
            <SideBarList>
                <SideBarListItem
                    active={!workspaceId && !tab}
                    icon="🍄"
                    onClick={() => {
                        // router.push('/luoye');
                        // hideSidebar();
                    }}
                >
                    开始
                </SideBarListItem>
                <SideBarListItem
                    active={tab === Tab.Settings}
                    icon="⚙️"
                    onClick={() => {
                        // history.push(`?item=${Item.Settings}`);
                        // hideSidebar();
                    }}
                >
                    设置
                </SideBarListItem>
                <SideBarListItem
                    icon="🪴"
                    active={workspaceId === defaultWorkspace.id}
                    // onClick={() => history.push(`?workspace=${defaultWorkspace.id}`)}
                >
                    <span>{defaultWorkspace.name || <Placeholder>未命名</Placeholder>}</span>
                    {defaultWorkspace.scope === Scope.Private && <SVG.Lock />}
                </SideBarListItem>
                <SideBarListItem
                    active={tab === Tab.DocBin}
                    icon="♻️"
                    onClick={() => {
                        // history.push(`?item=${Item.DocBin}`);
                        // hideSidebar();
                    }}
                >
                    文档回收站
                </SideBarListItem>
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
                        const newWorkspaceItems = await API.luoye.updateWorkspaceItems(
                            reOrdered.map((workspace) => workspace.id).concat(defaultWorkspace.id),
                        )(clientFetch);
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
