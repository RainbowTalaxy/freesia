import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';
import {
    PlaylistLibrary,
    Playlist,
    SongLibrary,
    Song,
    Config,
    Resource,
} from './types/playlist';

const PlaylistAPI = {
    // ## 播放列表
    library: () =>
        Rocket.get<PlaylistLibrary>(`${API_PREFIX}/playlist/library`),
    playlist: (id: string) =>
        Rocket.get<Playlist>(`${API_PREFIX}/playlist/${id}`),
    createPlaylist: (props: {
        name: string;
        description?: string;
        category?: string | null;
        coverImgUrl?: string | null;
        tinyCoverImgUrl?: string | null;
        releaseDate?: number | null;
    }) => Rocket.post<Playlist>(`${API_PREFIX}/playlist`, props),
    updatePlaylist: (
        id: string,
        props: {
            name?: string;
            description?: string;
            category?: string | null;
            coverImgUrl?: string | null;
            tinyCoverImgUrl?: string | null;
            releaseDate?: number | null;
        },
    ) => Rocket.put<Playlist>(`${API_PREFIX}/playlist/${id}`, props),
    deletePlaylist: (id: string) =>
        Rocket.delete(`${API_PREFIX}/playlist/${id}`),

    // ## 播放列表歌曲
    addSongsToPlaylist: (playlistId: string, songIds: string[]) =>
        Rocket.post<Playlist>(`${API_PREFIX}/playlist/${playlistId}/songs`, {
            songIds,
        }),
    removeSongFromPlaylist: (playlistId: string, songId: string) =>
        Rocket.delete<Playlist>(
            `${API_PREFIX}/playlist/${playlistId}/song/${songId}`,
        ),
    reorderPlaylistSongs: (playlistId: string, songIds: string[]) =>
        Rocket.put<Playlist>(
            `${API_PREFIX}/playlist/${playlistId}/song-order`,
            {
                songIds,
            },
        ),
    setPlaylistSongAttributes: (
        playlistId: string,
        songId: string,
        props: {
            featured?: boolean;
        },
    ) =>
        Rocket.put<Playlist>(
            `${API_PREFIX}/playlist/${playlistId}/song/${songId}/attributes`,
            props,
        ),

    // ## 歌曲
    songs: () => Rocket.get<SongLibrary>(`${API_PREFIX}/playlist/songs`),
    song: (id: string) => Rocket.get<Song>(`${API_PREFIX}/playlist/song/${id}`),
    addSong: (props: {
        name: string;
        artist?: string;
        album?: string;
        duration?: number;
        albumImgUrl?: string | null;
        tinyAlbumImgUrl?: string | null;
    }) => Rocket.post<Song>(`${API_PREFIX}/playlist/song`, props),
    updateSong: (
        id: string,
        props: {
            name?: string;
            artist?: string;
            album?: string;
            duration?: number;
            albumImgUrl?: string | null;
            tinyAlbumImgUrl?: string | null;
        },
    ) => Rocket.put<Song>(`${API_PREFIX}/playlist/song/${id}`, props),
    deleteSong: (id: string) =>
        Rocket.delete<Song>(`${API_PREFIX}/playlist/song/${id}`),
    addResourceToSong: (songId: string, resource: Resource) =>
        Rocket.post<Song>(
            `${API_PREFIX}/playlist/song/${songId}/resource`,
            resource,
        ),
    updateResourceOfSong: (songId: string, label: string, path: string) =>
        Rocket.put<Song>(
            `${API_PREFIX}/playlist/song/${songId}/resource/${label}`,
            {
                path,
            },
        ),
    removeResourceFromSong: (songId: string, label: string) =>
        Rocket.delete<Song>(
            `${API_PREFIX}/playlist/song/${songId}/resource/${label}`,
        ),

    // ## 配置
    config: () => Rocket.get<Config>(`${API_PREFIX}/playlist/config`),
    updateConfig: (props: { resourcePrefix?: string }) =>
        Rocket.put<Config>(`${API_PREFIX}/playlist/config`, props),
};

export default PlaylistAPI;
export * from './types/playlist';
