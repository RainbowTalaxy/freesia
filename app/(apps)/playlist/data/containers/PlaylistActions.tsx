'use client';
import { useState } from 'react';
import PlaylistForm from './PlaylistForm';
import { useRouter } from 'next/navigation';
import { ButtonGroup } from '../components/Actions';
import ActionButton from '../components/Actions/ActionButton';

const PlaylistActions = () => {
    const router = useRouter();
    const [isPlaylistFormVisible, setPlaylistFormVisible] = useState(false);

    return (
        <>
            <ButtonGroup>
                <ActionButton
                    iconName="playlist_add"
                    onClick={() => setPlaylistFormVisible(true)}
                >
                    创建播放列表
                </ActionButton>
                <ActionButton
                    iconName="library_music"
                    onClick={() => router.push('/playlist/data/songs')}
                >
                    查看曲库
                </ActionButton>
                <ActionButton
                    iconName="settings"
                    onClick={() => router.push('/playlist/data/config')}
                >
                    配置
                </ActionButton>
            </ButtonGroup>
            {isPlaylistFormVisible && (
                <PlaylistForm
                    onClose={async () => {
                        router.refresh();
                        setPlaylistFormVisible(false);
                    }}
                />
            )}
        </>
    );
};

export default PlaylistActions;
