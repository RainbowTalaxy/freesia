'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Song } from '@/api/playlist';
import SongForm from '../../../containers/SongForm';
import ActionButton from '../../../components/Actions/ActionButton';

interface Props {
    song: Song;
}

const SongActions = ({ song }: Props) => {
    const router = useRouter();
    const [isPlaylistFormVisible, setPlaylistFormVisible] = useState(false);

    return (
        <div>
            <ActionButton
                iconName="edit"
                onClick={() => setPlaylistFormVisible(true)}
            >
                编辑歌曲
            </ActionButton>
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
