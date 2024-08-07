'use client';
import { Button } from '@/components/form';
import { ButtonGroup } from '../../components/Actions';
import { useState } from 'react';
import SongForm from '../../containers/SongForm';
import { useRouter } from 'next/navigation';
import BatchAddSongForm from '../../containers/BatchAddSongForm';

const SongActions = () => {
    const router = useRouter();
    const [isSongFormVisible, setSongFormVisible] = useState(false);
    const [isBatchAddSongFormVisible, setBatchAddSongFormVisible] =
        useState(false);

    return (
        <>
            <ButtonGroup>
                <Button type="primary" onClick={() => setSongFormVisible(true)}>
                    添加歌曲
                </Button>
                <Button
                    type="primary"
                    onClick={() => setBatchAddSongFormVisible(true)}
                >
                    批量添加歌曲
                </Button>
                <Button onClick={() => router.push('/playlist/data')}>
                    查看播放列表库
                </Button>
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
