'use client';
import styles from './style.module.css';
import { Song } from '@/api/playlist';
import LineEditor from './LineEditor';
import { ButtonGroup } from '../../../../components/Actions';
import { Button } from '@/components/form';
import API, { clientFetch } from '@/api';
import { Logger } from '@/utils';
import { useRouter } from 'next/navigation';
import { Fragment, useCallback, useEffect } from 'react';
import useLyricStore from './useLyricStore';
import { Lyric } from './types';
import clsx from 'clsx';
import Spacer from '@/components/Spacer';
import Icon from '../../../../components/Icon';
import { useAudioStore } from '../AudioController';
import LyricAnimation from './LyricAnimation';

interface Props {
    song: Song;
}

const RECORD_KEY = ' ';

const Modifier = ({ song }: Props) => {
    const router = useRouter();
    const lyric = song.lyrics[0] as Lyric;
    const lines = useLyricStore((state) => state.lines);
    const mode = useLyricStore((state) => state.mode);
    const toggleMode = useLyricStore((state) => state.toggleMode);
    const recordNextWord = useLyricStore((state) => state.recordNextWord);
    const getTime = useAudioStore((state) => state.getTime);
    const audioRef = useAudioStore((state) => state.ref);

    const resetLyric = useCallback(async () => {
        try {
            const granted = confirm('确定要重置歌词吗？');
            if (granted) {
                await clientFetch(
                    API.playlist.updateAttributesOfSong(song.id, {
                        lyrics: [],
                    }),
                );
                router.refresh();
            }
        } catch (error: any) {
            alert('重置歌词失败');
            Logger.error(error);
        }
    }, [song.id, router]);

    const isRecording = mode === 'record';

    useEffect(() => {
        if (isRecording) {
            let startTime: number | null = null;
            const enter = (event: KeyboardEvent) => {
                event.preventDefault();
                if (event.key !== RECORD_KEY || startTime !== null) return;
                startTime = getTime();
            };
            const leave = (event: KeyboardEvent) => {
                event.preventDefault();
                if (event.key !== RECORD_KEY || startTime === null) return;
                const duration = getTime() - startTime;
                if (duration > 0) recordNextWord(startTime, duration);
                startTime = null;
            };
            window.addEventListener('keydown', enter);
            window.addEventListener('keyup', leave);
            return () => {
                window.removeEventListener('keydown', enter);
                window.removeEventListener('keyup', leave);
            };
        }
    }, [isRecording, getTime, recordNextWord]);

    useEffect(() => {
        let mounted = true;
        LyricAnimation.init(lines, getTime());
        const animate = () => {
            if (!mounted) return;
            LyricAnimation.seek(getTime());
            requestAnimationFrame(animate);
        };
        animate();
        return () => {
            mounted = false;
        };
    }, [lines, getTime]);

    Logger.debug('lines', lines);

    return (
        <>
            <ButtonGroup className={styles.align}>
                <label>版本：{lyric.version}</label>
                <Spacer />
                <button
                    className={clsx(styles.recordAction, isRecording && styles.active)}
                    onClick={() => {
                        toggleMode();
                        audioRef?.play();
                    }}
                >
                    <Icon name="radio_button_checked" />
                    {isRecording ? '录制中' : '录制'}
                </button>
            </ButtonGroup>
            <div className={clsx(styles.lyricList, styles.align)}>
                {lines.map((line, index) => (
                    <Fragment key={index}>
                        <LineEditor mode={mode} line={line} lineIdx={index} />
                    </Fragment>
                ))}
            </div>
            <ButtonGroup className={styles.align}>
                <Button
                    type="primary"
                    onClick={async () => {
                        try {
                            const lines = useLyricStore.getState().lines;
                            await clientFetch(
                                API.playlist.updateAttributesOfSong(song.id, {
                                    lyrics: [{ ...lyric, data: lines }],
                                }),
                            );
                            Logger.debug('lines', lines);
                            router.refresh();
                        } catch (error: any) {
                            alert('保存失败');
                            Logger.error(error);
                        }
                    }}
                >
                    保 存
                </Button>
                <Button type="danger" onClick={resetLyric}>
                    重 置
                </Button>
            </ButtonGroup>
        </>
    );
};

export default Modifier;
