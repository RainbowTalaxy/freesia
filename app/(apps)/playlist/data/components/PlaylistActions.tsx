'use client';
import { Button } from '@/components/form';
import { useState } from 'react';
import PlaylistForm from './PlaylistForm';
import { useRouter } from 'next/navigation';

const PlaylistActions = () => {
    const router = useRouter();
    const [isPlaylistFormVisible, setPlaylistFormVisible] = useState(false);

    return (
        <div>
            <Button
                onClick={() => {
                    setPlaylistFormVisible(true);
                }}
            >
                创建播放列表
            </Button>
            {isPlaylistFormVisible && (
                <PlaylistForm
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
