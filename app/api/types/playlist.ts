export interface Song {
    id: string;
    name: string;
    artist: string;
    album: string;
    duration: number; // 单位：毫秒
    albumImgUrl: string | null;
    tinyAlbumImgUrl: string | null;
    audios: Array<{
        label: string;
        url: string;
    }>;
    lyrics: object[];
    background: string | object | null;
    updatedAt: number;
}

export type SongItem = Pick<
    Song,
    'id' | 'name' | 'artist' | 'album' | 'tinyAlbumImgUrl' | 'duration'
>;

export interface SongLibrary {
    songs: SongItem[];
    updatedAt: number;
}

export type PlaylistSongItem = SongItem & {
    featured: boolean;
};

export interface Playlist {
    id: string;
    name: string;
    description: string;
    creator: string;
    category: string | null;
    coverImgUrl: string | null;
    tinyCoverImgUrl: string | null;
    releaseDate: number;
    songs: PlaylistSongItem[];
    duration: number; // 单位：毫秒
    updatedAt: number;
}

export type PlaylistItem = Pick<
    Playlist,
    'id' | 'name' | 'tinyCoverImgUrl' | 'category'
>;

export interface PlaylistLibrary {
    playlists: PlaylistItem[];
    updatedAt: number;
}
