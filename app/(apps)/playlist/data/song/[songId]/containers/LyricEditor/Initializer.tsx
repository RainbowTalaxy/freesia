'use client';
import API, { clientFetch } from '@/api';
import { ButtonGroup } from '../../../../components/Actions';
import styles from './style.module.css';
import { Song } from '@/api/playlist';
import { Button, Input, Select, TextArea } from '@/components/form';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { Logger } from '@/utils';
import { Line, Lyric } from './types';

interface Props {
    song: Song;
}

const breakOptions = [
    {
        value: 'space',
        label: '空格',
    } as const,
    {
        value: 'word',
        label: '词/字',
    } as const,
];

const VERSION = '1.0.0';

const convertRawLyric = (rawLyric: string, breakOption: (typeof breakOptions)[number]['value'], footer: string) => {
    const lines = rawLyric
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const items = (() => {
                switch (breakOption) {
                    case 'space': {
                        const _items = line.split(' ');
                        return _items.map((item, index) => (index === _items.length - 1 ? item : `${item} `));
                    }
                    case 'word': {
                        const _items = line.split('');
                        return _items
                            .map((item, index) => {
                                if (item === ' ') _items[index - 1] = `${_items[index - 1]} `;
                            })
                            .filter(Boolean);
                    }
                }
            })();
            return {
                track: 1,
                main: items.map((content) => ({
                    content,
                    offset: null,
                    duration: null,
                })),
                continue: false,
                subs: [],
            } as Line;
        });
    return {
        version: VERSION,
        data: lines,
        footer,
    } as Lyric;
};

const Initializer = ({ song }: Props) => {
    const router = useRouter();
    const breakOptionRef = useRef<HTMLSelectElement>(null);
    const rawLyricRef = useRef<HTMLTextAreaElement>(null);
    const footerRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <label>分词方式：</label>
            <Select raf={breakOptionRef} options={breakOptions} />
            <label>歌词原文：</label>
            <TextArea raf={rawLyricRef} className={styles.rawLyricTextarea} />
            <label>脚注：</label>
            <Input raf={footerRef} />
            <ButtonGroup className={styles.align}>
                <Button
                    type="primary"
                    onClick={async () => {
                        try {
                            const breakOption = breakOptionRef.current!.value as (typeof breakOptions)[number]['value'];
                            const rawLyric = rawLyricRef.current!.value;
                            const footer = footerRef.current!.value;
                            const lyric = convertRawLyric(rawLyric, breakOption, footer);
                            await clientFetch(
                                API.playlist.updateAttributesOfSong(song.id, {
                                    lyrics: [lyric],
                                }),
                            );
                            router.refresh();
                        } catch (error: any) {
                            alert(`创建失败：${error.message}`);
                            Logger.error(error);
                        }
                    }}
                >
                    创 建
                </Button>
            </ButtonGroup>
        </>
    );
};

export default Initializer;
