'use client';
import { Button } from '@/components/form';
import { useState } from 'react';
import PlaylistForm from '../../../containers/PlaylistForm';
import { useRouter } from 'next/navigation';
import { Playlist } from '@/api/playlist';

interface Props {
    playlist: Playlist;
}

const PlaylistActions = ({ playlist }: Props) => {
    const router = useRouter();
    const [isPlaylistFormVisible, setPlaylistFormVisible] = useState(false);

    return (
        <div>
            <Button type="primary" onClick={() => setPlaylistFormVisible(true)}>
                编辑播放列表
            </Button>
            {isPlaylistFormVisible && (
                <PlaylistForm
                    playlist={playlist}
                    onClose={async () => {
                        router.refresh();
                        setPlaylistFormVisible(false);
                    }}
                />
            )}
        </div>
    );
};

export default PlaylistActions;
