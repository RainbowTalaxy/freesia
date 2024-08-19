'use client';
import { useState } from 'react';
import PlaylistForm from '../../../containers/PlaylistForm';
import { useRouter } from 'next/navigation';
import { Playlist } from '@/api/playlist';
import ActionButton from '../../../components/Actions/ActionButton';
import SongPicker from './SongPicker';
import { ButtonGroup } from '../../../components/Actions';

interface Props {
    playlist: Playlist;
}

const PlaylistActions = ({ playlist }: Props) => {
    const router = useRouter();
    const [isPlaylistFormVisible, setPlaylistFormVisible] = useState(false);
    const [isSongPickerVisible, setSongPickerVisible] = useState(false);

    return (
        <>
            <ButtonGroup>
                <ActionButton
                    iconName="edit"
                    onClick={() => setPlaylistFormVisible(true)}
                >
                    编辑
                </ActionButton>
                <ActionButton
                    iconName="add_circle"
                    onClick={() => setSongPickerVisible(true)}
                >
                    添加歌曲
                </ActionButton>
            </ButtonGroup>
            {isPlaylistFormVisible && (
                <PlaylistForm
                    playlist={playlist}
                    onClose={async () => {
                        router.refresh();
                        setPlaylistFormVisible(false);
                    }}
                />
            )}
            {isSongPickerVisible && (
                <SongPicker
                    playlist={playlist}
                    onClose={() => {
                        router.refresh();
                        setSongPickerVisible(false);
                    }}
                />
            )}
        </>
    );
};

export default PlaylistActions;
