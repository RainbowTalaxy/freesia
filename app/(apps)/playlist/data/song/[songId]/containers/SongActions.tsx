'use client';
import { Button } from '@/components/form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Song } from '@/api/playlist';
import SongForm from '../../../containers/SongForm';

interface Props {
    song: Song;
}

const SongActions = ({ song }: Props) => {
    const router = useRouter();
    const [isPlaylistFormVisible, setPlaylistFormVisible] = useState(false);

    return (
        <div>
            <Button type="primary" onClick={() => setPlaylistFormVisible(true)}>
                编辑歌曲
            </Button>
            {isPlaylistFormVisible && (
                <SongForm
                    song={song}
                    onClose={async () => {
                        router.refresh();
                        setPlaylistFormVisible(false);
                    }}
                />
            )}
        </div>
    );
};

export default SongActions;
