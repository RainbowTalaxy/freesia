'use client';
import { useContext, useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from '@hello-pangea/dnd';
import API, { clientFetch } from '@/api';
import { Logger } from '@/utils';
import { Scope } from '@/api/luoye';
import { BASE_PATH } from '@/constants';
import { SideBarList, SideBarListItem } from '../../components/PageLayout';
import Placeholder from '../../components/PlaceHolder';
import SVG from '../../components/SVG';
import { HomeContext } from '../context';
import Toast from '../../components/Notification/Toast';

function normalizePathname(pathname: string) {
    if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
        return pathname.slice(BASE_PATH.length) || '/';
    }
    return pathname;
}

const SideBar = () => {
    const { tab, workspaceId } = useParams<{
        tab?: string;
        workspaceId?: string;
    }>();
    const pathname = usePathname();
    const { userId, workspaces: _workspaces, userWorkspace, setAllWorkspaces } = useContext(HomeContext);
    const [workspaces, setWorkspaces] = useState(_workspaces!);
    const normalizedPathname = normalizePathname(pathname);
    const isHomeActive = normalizedPathname === '/luoye';
    const isAiChatActive = normalizedPathname === '/luoye/ai-chat' || normalizedPathname.startsWith('/luoye/ai-chat/');

    useEffect(() => {
        if (_workspaces) setWorkspaces(_workspaces);
    }, [_workspaces]);

    if (!userWorkspace) return null;

    const handleDragEnd: OnDragEndResponder = async (result) => {
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
                API.luoye.updateWorkspaceItems(reOrdered.map((workspace) => workspace.id).concat(userWorkspace.id)),
            );
            setAllWorkspaces(newWorkspaceItems);
        } catch (error: any) {
            Toast.notify(error.message);
            Logger.error('工作区顺序更新失败', error);
            setWorkspaces(workspaces);
        }
    };

    return (
        <>
            <SideBarList>
                <SideBarListItem href="/luoye" active={isHomeActive} icon="🍄">
                    开始
                </SideBarListItem>
                <SideBarListItem href="/luoye/settings" active={tab === 'settings'} icon="⚙️">
                    设置
                </SideBarListItem>
                <SideBarListItem href="/luoye/ai-chat" active={tab === 'ai-chat' || isAiChatActive} icon="🤖">
                    问一问
                </SideBarListItem>
                <SideBarListItem
                    icon="🪴"
                    href={`/luoye/workspace`}
                    active={tab === 'workspace' || workspaceId === userId}
                >
                    <span>{userWorkspace.name || <Placeholder>未命名</Placeholder>}</span>
                    {userWorkspace.scope === Scope.Private && <SVG.Lock />}
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
            <DragDropContext onDragEnd={handleDragEnd}>
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
