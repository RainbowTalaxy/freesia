'use client';
import { Playlist } from '@/api/playlist';
import List, { ListItem } from '../../../components/List';
import Placeholder from '../../../components/Placeholder';
import SongListItem from '../../../components/SongListItem';
import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from '@hello-pangea/dnd';
import API, { clientFetch } from '@/api';
import { useEffect, useState } from 'react';
import { Logger } from '@/utils';
import { useRouter } from 'next/navigation';

interface Props {
    playlist: Playlist;
}

const SongList = ({ playlist }: Props) => {
    const router = useRouter();
    const [songs, setSongs] = useState(playlist.songs);

    const handleDragEnd: OnDragEndResponder = async (result) => {
        const sourceIdx = result.source.index;
        const destIdx = result.destination?.index ?? -1;
        if (destIdx < 0 || sourceIdx === destIdx) return;
        const reordered = Array.from(songs);
        const [removed] = reordered.splice(sourceIdx, 1);
        reordered.splice(destIdx, 0, removed);
        // 先更新状态，避免回弹动画
        setSongs(reordered);
        try {
            await clientFetch(
                API.playlist.reorderPlaylistSongs(
                    playlist.id,
                    reordered.map((song) => song.id),
                ),
            );
            router.refresh();
        } catch (error: any) {
            Logger.error('更新顺序失败', error);
            setSongs(songs);
        }
    };

    useEffect(() => {
        setSongs(playlist.songs);
    }, [playlist]);

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="droppable">
                {(provided) => (
                    <List ref={provided.innerRef} droppableProps={provided.droppableProps}>
                        {songs.length === 0 && (
                            <ListItem>
                                <Placeholder>暂无歌曲</Placeholder>
                            </ListItem>
                        )}
                        {songs.map((song, index) => (
                            <Draggable key={song.id} draggableId={song.id} index={index}>
                                {(provided) => (
                                    <SongListItem
                                        ref={provided.innerRef}
                                        playlist={playlist}
                                        song={song}
                                        draggableProps={provided.draggableProps}
                                        dragHandleProps={provided.dragHandleProps}
                                    />
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </List>
                )}
            </Droppable>
        </DragDropContext>
    );
};
export default SongList;
