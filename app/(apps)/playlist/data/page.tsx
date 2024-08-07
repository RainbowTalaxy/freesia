import listStyle from './styles/list.module.css';
import { serverFetch } from '@/api/server';
import API from '@/api';
import dayjs from 'dayjs';
import PlaylistListItem from './components/PlaylistListItem';
import PlaylistActions from './containers/PlaylistActions';
import { Metadata } from 'next';
import { Fragment } from 'react';
import { PlaylistItem } from '@/api/playlist';
import List from './components/List';

export const metadata: Metadata = {
    title: '播放列表库',
};

const sortPlaylistItems = (list: PlaylistItem[]) => {
    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
};

export default async function Page() {
    const library = await serverFetch(API.playlist.library());

    // 根据名称排序
    const defaultGroup = sortPlaylistItems(
        library.playlists.filter((playlist) => !playlist.category),
    );

    // 根据 category 分组
    const playlistGroups = library.playlists.reduce((acc, playlist) => {
        const category = playlist.category;
        if (category) {
            if (!acc[category]) acc[category] = [];
            acc[category].push(playlist);
        }
        return acc;
    }, {} as Record<string, typeof library.playlists>);

    const categories = Object.keys(playlistGroups);

    return (
        <div className="page">
            <h1>播放列表库</h1>
            <p>
                上次更新：
                {dayjs(library.updatedAt).format('YYYY年M月D日 HH:mm:ss')}
            </p>
            <PlaylistActions />
            {defaultGroup.length > 0 && (
                <List>
                    {defaultGroup.map((playlist) => (
                        <PlaylistListItem
                            key={playlist.id}
                            playlist={playlist}
                        />
                    ))}
                </List>
            )}
            {categories.map((category) => {
                const sortedGroup = sortPlaylistItems(playlistGroups[category]);
                return (
                    <List key={category} header={category}>
                        {sortedGroup.map((playlist) => (
                            <PlaylistListItem
                                key={playlist.id}
                                playlist={playlist}
                            />
                        ))}
                    </List>
                );
            })}
        </div>
    );
}
