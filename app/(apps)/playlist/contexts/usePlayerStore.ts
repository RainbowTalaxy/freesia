import { Playlist, Song } from '@/api/playlist';
import { create } from 'zustand';
import AudioPlayer from '../utils/AudioPlayer';
import API, { clientFetch } from '@/api';
import { IS_SERVER } from '@/constants';

export type PlayerMode = 'normal' | 'loop' | 'single-loop';

interface PlayerStore {
    songIds: string[];
    song: Song | null;
    isPlaying: boolean;
    audio: HTMLAudioElement | null;
    getTime: () => number;
    duration: number;
    volume: number;
    shuffle: boolean;
    mode: PlayerMode;
    setPlaylist: (
        playlist: Playlist,
        autoPlay?: boolean,
        songId?: string,
    ) => void;
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    setVolume: (value: number) => void;
    toggleShuffle: () => void;
    switchMode: (mode: PlayerMode) => void;
    prev: () => void;
    next: () => void;
}

const shuffleList = (list: string[]) => {
    const newList = list.slice();
    for (let i = newList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newList[i], newList[j]] = [newList[j], newList[i]];
    }
    return newList;
};

const usePlayerStore = create<PlayerStore>()((set, get) => {
    if (IS_SERVER) return {} as PlayerStore;

    let songList: PlayerStore['songIds'] = [];

    const setList = (list: string[]) => {
        if (list.every((id, idx) => songList[idx] === id)) return;
        const { shuffle } = get();
        set({ songIds: list });
        songList = shuffle ? shuffleList(list) : list;
    };

    const switchSong = async (songId: string | null) => {
        if (!songId) {
            set({
                song: null,
                isPlaying: false,
                duration: Infinity,
            });
            return;
        }
        const { isPlaying } = get();
        const [song, config] = await Promise.all([
            clientFetch(API.playlist.song(songId)),
            clientFetch(API.playlist.config()),
        ]);
        set({ song, duration: song.duration });
        const audioUrl = config.resourcePrefix + song.resources[0]?.path;
        if (!audioUrl) return;
        AudioPlayer.shift(audioUrl, isPlaying);
    };

    const restartList = () => {
        switchSong(songList[0] ?? null);
    };

    const nextIdx = (idx: number) => {
        return (idx + 1) % songList.length;
    };

    AudioPlayer.audio.addEventListener('ended', () => {
        const { song, mode } = get();
        const songIdx = songList.indexOf(song!.id);
        if (songIdx === -1) return restartList();
        switch (mode) {
            case 'normal': {
                if (songIdx === songList.length - 1) {
                    set({ isPlaying: false });
                    restartList();
                    return;
                }
                switchSong(songList[songIdx + 1]);
                return;
            }
            case 'loop': {
                switchSong(songList[nextIdx(songIdx)]);
                return;
            }
            case 'single-loop': {
                AudioPlayer.replay();
                return;
            }
        }
    });

    AudioPlayer.audio.addEventListener('play', () => {
        set({ isPlaying: true });
    });

    AudioPlayer.audio.addEventListener('pause', () => {
        if (AudioPlayer.audio.currentTime === AudioPlayer.audio.duration)
            return;
        set({ isPlaying: false });
    });

    AudioPlayer.audio.addEventListener('durationchange', () => {
        set({ duration: AudioPlayer.audio.duration * 1000 });
    });

    AudioPlayer.audio.volume = 0.5;

    return {
        songIds: [],
        song: null,
        isPlaying: false,
        audio: AudioPlayer.audio,
        getTime: () => Math.floor(AudioPlayer.audio.currentTime * 1000),
        duration: Infinity,
        volume: AudioPlayer.audio.volume,
        shuffle: false,
        mode: 'loop' as const,
        setPlaylist: (playlist, autoPlay, songId) => {
            const { song } = get();
            setList(playlist.songs.map((song) => song.id));
            if (autoPlay !== undefined) set({ isPlaying: autoPlay });
            if (songId) switchSong(songId);
            if (song) return;
            switchSong(songList[0] ?? null);
        },
        play: () => {
            AudioPlayer.play();
        },
        pause: () => {
            AudioPlayer.pause();
        },
        seek: (time) => {
            AudioPlayer.audio.currentTime = time / 1000;
        },
        setVolume: (value) => {
            AudioPlayer.audio.volume = value;
            set({ volume: AudioPlayer.audio.volume });
        },
        toggleShuffle: () => {
            const { songIds, shuffle } = get();
            set({ shuffle: !shuffle });
            setList(songIds);
        },
        switchMode: (mode: PlayerMode) => {
            set({ mode });
        },
        prev: () => {
            const { song } = get();
            const songIdx = songList.indexOf(song!.id);
            if (AudioPlayer.audio.currentTime >= 5) return AudioPlayer.replay();
            if (songIdx === -1 || songIdx === 0) return;
            switchSong(songList[songIdx - 1]);
        },
        next: () => {
            const { song } = get();
            const songIdx = songList.indexOf(song!.id);
            if (songIdx === -1) return restartList();
            switchSong(songList[nextIdx(songIdx)]);
        },
    };
});

export default usePlayerStore;
