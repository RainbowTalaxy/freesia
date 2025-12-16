'use client';

import usePlayerStore from '@/(apps)/playlist/contexts/usePlayerStore';
import { Playlist } from '@/api/playlist';
import { useEffect } from 'react';

interface Props {
    playlist: Playlist;
}

const Effect = ({ playlist }: Props) => {
    useEffect(() => {
        usePlayerStore.getState().setPlaylist(playlist);
    }, [playlist]);

    return null;
};

export default Effect;
