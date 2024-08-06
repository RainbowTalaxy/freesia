import { Rocket } from './fetch';
import { API_PREFIX } from './fetch/constants';
import { Library, Playlist } from './types/playlist';

const PlaylistAPI = {
    library: () => Rocket.get<Library>(`${API_PREFIX}/playlist/library`),
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
};

export default PlaylistAPI;
export * from './types/playlist';
