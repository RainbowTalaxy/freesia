'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Song } from '@/api/playlist';
import SongForm from '../../../containers/SongForm';
import ActionButton from '../../../components/Actions/ActionButton';
import { ButtonGroup } from '../../../components/Actions';
import ResourceForm from './ResourceForm';
import AppleMusicLyricImportForm from './AppleMusicLyricImportForm';

interface Props {
    song: Song;
}

const SongActions = ({ song }: Props) => {
    const router = useRouter();
    const [isPlaylistFormVisible, setPlaylistFormVisible] = useState(false);
    const [isResourceFormVisible, setResourceFormVisible] = useState(false);
    const [isAppleMusicLyricImportFormVisible, setAppleMusicLyricImportFormVisible] = useState(false);

    return (
        <>
            <ButtonGroup>
                <ActionButton iconName="edit" onClick={() => setPlaylistFormVisible(true)}>
                    编辑
                </ActionButton>
                <ActionButton iconName="add_circle" onClick={() => setResourceFormVisible(true)}>
                    添加资源
                </ActionButton>
                <ActionButton iconName="download" onClick={() => setAppleMusicLyricImportFormVisible(true)}>
                    导入苹果歌词
                </ActionButton>
            </ButtonGroup>
            {isPlaylistFormVisible && (
                <SongForm
                    song={song}
                    onClose={async (newSong) => {
                        if (newSong) router.refresh();
                        setPlaylistFormVisible(false);
                    }}
                />
            )}
            {isResourceFormVisible && (
                <ResourceForm
                    songId={song.id}
                    onClose={async (newSong) => {
                        if (newSong) router.refresh();
                        setResourceFormVisible(false);
                    }}
                />
            )}
            {isAppleMusicLyricImportFormVisible && (
                <AppleMusicLyricImportForm
                    songId={song.id}
                    onClose={async (newSong) => {
                        if (newSong) router.refresh();
                        setAppleMusicLyricImportFormVisible(false);
                    }}
                />
            )}
        </>
    );
};

export default SongActions;
