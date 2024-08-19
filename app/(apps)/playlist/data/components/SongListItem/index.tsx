'use client';
import API, { clientFetch } from '@/api';
import { msToDurationNumText } from '../../../utils';
import Cover from '../Cover';
import { ListItem } from '../List';
import style from './style.module.css';
import { Playlist, PlaylistSongItem, SongItem } from '@/api/playlist';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import clsx from 'clsx';
import { ForwardedRef, forwardRef, useEffect, useState } from 'react';
import {
    DraggableProvidedDragHandleProps,
    DraggableProvidedDraggableProps,
} from '@hello-pangea/dnd';

interface Props {
    playlist?: Playlist;
    song: SongItem | PlaylistSongItem;
    draggableProps?: DraggableProvidedDraggableProps;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

const SongListItem = forwardRef(
    (
        { playlist, song, draggableProps, dragHandleProps }: Props,
        ref: ForwardedRef<HTMLLIElement>,
    ) => {
        const router = useRouter();
        const [isFeatured, setFeatured] = useState(
            'featured' in song ? song.featured : false,
        );

        useEffect(() => {
            if ('featured' in song) setFeatured(song.featured);
        }, [song]);

        const toggleFeatured = async () => {
            try {
                await clientFetch(
                    API.playlist.setPlaylistSongAttributes(
                        playlist!.id,
                        song.id,
                        {
                            featured: !isFeatured,
                        },
                    ),
                );
                setFeatured(!isFeatured);
                router.refresh();
            } catch {
                alert('操作失败');
            }
        };

        const handleDelete = async () => {
            const granted = confirm(`确定删除 ${song.name} 吗？`);
            if (!granted) return;
            try {
                if (playlist) {
                    await clientFetch(
                        API.playlist.removeSongFromPlaylist(
                            playlist.id,
                            song.id,
                        ),
                    );
                } else {
                    await clientFetch(API.playlist.deleteSong(song.id));
                }
                router.refresh();
            } catch {
                alert('删除失败');
            }
        };

        return (
            <ListItem
                ref={ref}
                draggableProps={draggableProps}
                dragHandleProps={dragHandleProps}
                onClick={() => router.push(`/playlist/data/song/${song.id}`)}
            >
                {playlist && 'featured' in song && (
                    <div
                        className={clsx(
                            style.featured,
                            isFeatured && style.active,
                        )}
                        onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleFeatured();
                        }}
                    >
                        <Icon name="fiber_manual_record" />
                    </div>
                )}
                <Cover
                    className={style.cover}
                    url={song.tinyAlbumImgUrl}
                    size={36}
                />
                <div className={style.name}>{song.name}</div>
                <div className={style.artist}>{song.artist}</div>
                <div className={style.duration}>
                    {msToDurationNumText(song.duration)}
                </div>
                <div
                    className={style.action}
                    onClick={async (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDelete();
                    }}
                >
                    删除
                </div>
            </ListItem>
        );
    },
);

export default SongListItem;
