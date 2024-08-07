import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';
import { PlaylistLibrary, Playlist, SongLibrary, Song } from './types/playlist';

const PlaylistAPI = {
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
};

export default PlaylistAPI;
export * from './types/playlist';
