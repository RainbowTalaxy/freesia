'use client';
import { ButtonGroup } from '../../components/Actions';
import { useState } from 'react';
import SongForm from '../../containers/SongForm';
import { useRouter } from 'next/navigation';
import BatchAddSongForm from '../../containers/BatchAddSongForm';
import ActionButton from '../../components/Actions/ActionButton';

const SongActions = () => {
    const router = useRouter();
    const [isSongFormVisible, setSongFormVisible] = useState(false);
    const [isBatchAddSongFormVisible, setBatchAddSongFormVisible] = useState(false);

    return (
        <>
            <ButtonGroup>
                <ActionButton iconName="add_circle" onClick={() => setSongFormVisible(true)}>
                    添加歌曲
                </ActionButton>
                <ActionButton iconName="post_add" onClick={() => setBatchAddSongFormVisible(true)}>
                    批量添加
                </ActionButton>
                <ActionButton iconName="queue_music" onClick={() => router.push('/playlist/data')}>
                    播放列表库
                </ActionButton>
            </ButtonGroup>
            {isSongFormVisible && (
                <SongForm
                    onClose={async () => {
                        router.refresh();
                        setSongFormVisible(false);
                    }}
                />
            )}
            {isBatchAddSongFormVisible && (
                <BatchAddSongForm
                    onClose={() => {
                        router.refresh();
                        setBatchAddSongFormVisible(false);
                    }}
                />
            )}
        </>
    );
};

export default SongActions;
