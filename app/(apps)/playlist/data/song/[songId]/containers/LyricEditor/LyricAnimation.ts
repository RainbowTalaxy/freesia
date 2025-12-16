import { Logger } from '@/utils';
import { Line } from './types';

const percentToProgress = (percent: number) => {
    return -20 + (120 * percent) / 100 + '%';
};

class LyricAnimation {
    static lines: Line[];
    static words: Array<{
        lineIdx: number;
        wordIdxInLine: number;
        offset: number;
        duration: number;
        node: HTMLSpanElement | null;
    }>;
    static lineIdxTable: number[];
    static wordIdx: number | null = null;

    static init(lines: Line[], time: number) {
        this.lines = lines;
        this.words = [];
        this.lineIdxTable = [];
        for (let i = 0; i < lines.length; i += 1) {
            this.lineIdxTable.push(this.words.length);
            for (let j = 0; j < lines[i].main.length; j += 1) {
                const word = lines[i].main[j];
                if (word.offset !== null && word.duration !== null) {
                    const lyricWord = {
                        lineIdx: i,
                        wordIdxInLine: j,
                        offset: word.offset,
                        duration: word.duration,
                        node: document.querySelector(
                            `.lyric-word-${i}-${j}`,
                        ) as HTMLSpanElement,
                    };
                    this.words.push(lyricWord);
                    if (this.wordIdx === null) {
                        if (word.offset <= time) {
                            lyricWord.node.style.setProperty(
                                '--progress',
                                percentToProgress(100),
                            );
                        } else {
                            this.wordIdx = this.words.length - 1;
                            lyricWord.node.style.setProperty(
                                '--progress',
                                percentToProgress(
                                    (time - word.offset) / word.duration,
                                ),
                            );
                        }
                    } else {
                        lyricWord.node.style.setProperty(
                            '--progress',
                            percentToProgress(0),
                        );
                    }
                }
            }
        }
        // 加一个空白词，用于表示歌词结束
        this.words.push({
            lineIdx: lines.length,
            wordIdxInLine: 0,
            offset: Infinity,
            duration: 0,
            node: null,
        });
        if (this.wordIdx === null) {
            this.wordIdx = this.words.length - 1;
        }
    }

    /** 基于 diff 算法重新定位歌词位置，并调整歌词进度 */
    static seek(time: number) {
        if (this.wordIdx === null)
            throw new Error('LyricAnimation not initialized');
        while (true) {
            try {
                const word = this.words[this.wordIdx];
                if (word.offset + word.duration <= time) {
                    word.node?.style.setProperty(
                        '--progress',
                        percentToProgress(100),
                    );
                    this.wordIdx += 1;
                } else if (word.offset > time) {
                    word.node?.style.setProperty(
                        '--progress',
                        percentToProgress(0),
                    );
                    if (this.wordIdx === 0) break;
                    const prevWord = this.words[this.wordIdx - 1];
                    if (prevWord.offset + prevWord.duration <= time) break;
                    this.wordIdx -= 1;
                } else {
                    word.node?.style.setProperty(
                        '--progress',
                        percentToProgress(
                            ((time - word.offset) * 100) / word.duration,
                        ),
                    );
                    break;
                }
            } catch (error: any) {
                Logger.error('[LyricAnimation]', error.message);
            }
        }
    }
}

export default LyricAnimation;
