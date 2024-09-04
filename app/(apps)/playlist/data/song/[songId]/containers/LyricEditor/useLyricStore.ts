import { create } from 'zustand';
import { Lyric } from './types';
import { produce } from 'immer';

export type Mode = 'edit' | 'record';

type Line = Lyric['data'][number];

const useLyricStore = create<{
    initialized: boolean;
    initialize: (lyric: Lyric) => void;
    clear: () => void;
    mode: Mode;
    toggleMode: () => void;
    lines: Lyric['data'];
    addLine: (line: Line, index: number) => void;
    removeLine: (line: Line) => void;
    setLineAttrs: (line: Line, attrs: Pick<Line, 'track' | 'continue'>) => void;
    updateLine: (
        line: Line,
        props: {
            splitList: Array<{ word: Line['main'][number]; indexes: number[] }>;
            mergeList: Line['main'];
            attrs: Pick<Line, 'track' | 'continue'>;
        },
    ) => void;
    clearLineRecord: (line: Line) => void;
    recordNextWord: (startTime: number, duration: number) => void;
}>()((set, get) => {
    return {
        initialized: false,
        initialize: (lyric) => {
            set({ initialized: true, lines: lyric.data });
        },
        clear: () => {
            set({ initialized: false, lines: [] });
        },
        mode: 'edit' as const,
        toggleMode: () => {
            set((state) => {
                return { mode: state.mode === 'edit' ? 'record' : 'edit' };
            });
        },
        lines: [],
        addLine: (line, index) => {
            set((state) => {
                const newLines = state.lines.slice();
                newLines.splice(index, 0, line);
                return { lines: newLines };
            });
        },
        removeLine: (line) => {
            set((state) => {
                const newLines = state.lines.filter((l) => l !== line);
                return { lines: newLines };
            });
        },
        setLineAttrs: (line, attrs) => {
            const { lines } = get();
            const lineIndex = lines.findIndex((l) => l === line);
            if (lineIndex === -1) return;
            set((state) => {
                const newLines = produce(state.lines, (draft) => {
                    draft[lineIndex] = { ...draft[lineIndex], ...attrs };
                });
                return { lines: newLines };
            });
        },
        updateLine: (line, { splitList: _splitList, mergeList, attrs }) => {
            const { lines } = get();
            const lineIndex = lines.findIndex((l) => l === line);
            if (lineIndex === -1) return;
            const targetLine = lines[lineIndex];
            const splitList = _splitList
                .map((item) => ({
                    index: targetLine.main.findIndex((w) => w === item.word),
                    indexes: item.indexes,
                }))
                .filter((item) => item.index !== -1)
                .sort((a, b) => b.index - a.index);
            const _sortedMergeIdxList = mergeList
                .map((word) => targetLine.main.findIndex((w) => w === word))
                .filter((i) => i !== -1)
                .sort((a, b) => b - a);
            set(() => {
                const newLines = produce(lines, (draft) => {
                    const targetLine = draft[lineIndex];
                    const sortedMergeList = _sortedMergeIdxList.map(
                        (i) => targetLine.main[i],
                    );
                    splitList.forEach((item) => {
                        const word = targetLine.main[item.index];
                        const indexes = item.indexes.sort((a, b) => a - b);
                        const ranges = indexes.map((index, i) => {
                            const start = index;
                            const end = indexes[i + 1] ?? word.content.length;
                            return [start, end];
                        });
                        const averageDuration = word.duration
                            ? word.duration / ranges.length
                            : null;
                        const splittedWords = ranges.map(([start, end], i) => {
                            return {
                                content: word.content.slice(start, end),
                                offset: word.offset
                                    ? word.offset +
                                      (averageDuration ?? 0) * (i + 1)
                                    : null,
                                duration: averageDuration,
                            };
                        });
                        if (ranges.length > 0) {
                            word.content = word.content.slice(0, ranges[0][0]);
                            word.duration = averageDuration;
                        }
                        targetLine.main.splice(
                            item.index + 1,
                            0,
                            ...splittedWords,
                        );
                    });
                    sortedMergeList.forEach((word) => {
                        const wordIndex = targetLine.main.findIndex(
                            (w) => w === word,
                        );
                        console.log(wordIndex);
                        const prevWord = targetLine.main[wordIndex - 1];
                        console.log(prevWord.content, word.content);
                        if (!word) return;
                        prevWord.content += word.content;
                        if (
                            prevWord.duration &&
                            prevWord.offset &&
                            word.offset &&
                            word.duration
                        )
                            prevWord.duration +=
                                word.offset - prevWord.offset + word.duration;
                        targetLine.main.splice(wordIndex, 1);
                    });
                    draft[lineIndex] = { ...draft[lineIndex], ...attrs };
                });
                return { lines: newLines };
            });
        },
        clearLineRecord: (line) => {
            const { lines } = get();
            const lineIndex = lines.findIndex((l) => l === line);
            if (lineIndex === -1) return;
            set((state) => {
                const newLines = produce(state.lines, (draft) => {
                    const targetLine = draft[lineIndex];
                    targetLine.main.forEach((word) => {
                        word.offset = null;
                        word.duration = null;
                    });
                });
                return { lines: newLines };
            });
        },
        recordNextWord: (startTime, duration) => {
            const { lines } = get();
            set((state) => {
                const newLines = produce(state.lines, (draft) => {
                    const targetLine = draft.find((line) =>
                        line.main.some((word) => !word.offset),
                    );
                    if (!targetLine) return;
                    const targetWord = targetLine.main.find(
                        (word) => !word.offset,
                    );
                    if (!targetWord) return;
                    targetWord.offset = startTime;
                    targetWord.duration = duration;
                });
                return { lines: newLines };
            });
        },
    };
});

export default useLyricStore;
