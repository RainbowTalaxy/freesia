'use client';
import { Button } from '@/components/form';
import { useState } from 'react';
import PlaylistForm from './PlaylistForm';
import { useRouter } from 'next/navigation';
import { ButtonGroup } from '../components/Actions';

const PlaylistActions = () => {
    const router = useRouter();
    const [isPlaylistFormVisible, setPlaylistFormVisible] = useState(false);

    return (
        <>
            <ButtonGroup>
                <Button
                    type="primary"
                    onClick={() => setPlaylistFormVisible(true)}
                >
                    创建播放列表
                </Button>
                <Button onClick={() => router.push('/playlist/data/songs')}>
                    查看曲库
                </Button>
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
