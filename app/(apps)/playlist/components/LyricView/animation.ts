import gsap from 'gsap';
import {
    Line,
    Lyric,
} from '../../data/song/[songId]/containers/LyricEditor/types';
import styles from './style.module.css';
import { ScrollToPlugin } from 'gsap/all';

gsap.registerPlugin(ScrollToPlugin);

const percentToProgress = (percent: number) => {
    return -20 + (120 * percent) / 100 + '%';
};

interface WordData {
    node: HTMLElement;
    prev: WordData | null;
    next: WordData | null;
    content: string;
    offset: number;
    duration: number;
}

class LineAnimation {
    timers: ReturnType<typeof setTimeout>[] = [];
    animations: gsap.core.Tween[] = [];
    wordsData: WordData[];

    constructor(wordsData: WordData[]) {
        this.wordsData = wordsData;
    }

    resetTimer() {
        this.timers.forEach((timer) => {
            clearTimeout(timer);
        });
        this.animations.forEach((animation) => {
            animation.kill();
        });
        this.timers = [];
        this.animations = [];
    }

    seek(time: number) {
        this.resetTimer();
        this.wordsData.forEach((wordData) => {
            const progress = Math.max(
                Math.min(
                    100,
                    ((time - wordData.offset) * 100) / wordData.duration,
                ),
                0,
            );
            gsap.set(wordData.node, {
                '--progress': percentToProgress(progress),
            });
        });
    }

    start(time: number) {
        this.resetTimer();
        this.wordsData.forEach((wordData) => {
            const progress = Math.max(
                Math.min(
                    100,
                    ((time - wordData.offset) * 100) / wordData.duration,
                ),
                0,
            );
            gsap.set(wordData.node, {
                '--progress': percentToProgress(progress),
            });
            if (progress < 100) {
                // Logger.debug('word timer init', wordData.content);
                const timer = setTimeout(() => {
                    const tween = gsap.to(wordData.node, {
                        '--progress': percentToProgress(100),
                        duration: wordData.duration / 1000,
                    });
                    this.animations.push(tween);
                }, wordData.offset - time);
                this.timers.push(timer);
            }
        });
    }

    pause() {
        this.resetTimer();
    }

    clear() {
        this.pause();
        this.wordsData.forEach((wordData) => {
            gsap.set(wordData.node, {
                '--progress': percentToProgress(0),
            });
        });
    }

    finish() {
        this.resetTimer();
        this.wordsData.forEach((wordData) => {
            gsap.set(wordData.node, {
                '--progress': percentToProgress(100),
            });
        });
    }
}

interface LineData {
    node: HTMLElement;
    prev: LineData | null;
    next: LineData | null;
    offset: number;
    data: Line;
    lineAnimation: LineAnimation;
}

class Animation {
    static scrollContainer: HTMLElement | null = null;
    static activeLines: LineData[] = [];
    static timers: ReturnType<typeof setTimeout>[] = [];

    static init(lyric: Lyric, time: number) {
        this.scrollContainer = document.querySelector('.lyric-scroll');
        let prevLine: LineData | null = null;
        for (let i = 0; i < lyric.data.length; i += 1) {
            const line = lyric.data[i];
            const lineData: LineData = {
                node: document.querySelector(`.lyric-${i}`) as HTMLElement,
                prev: prevLine,
                next: null,
                offset: i === 0 ? 0 : line.main[0].offset!,
                data: line,
                lineAnimation: null!,
            };
            if (prevLine) {
                prevLine.next = lineData;
            }
            prevLine = lineData;
            let wordsData: WordData[] = [];
            let prevWord: WordData | null = null;
            for (let j = 0; j < line.main.length; j += 1) {
                const word = line.main[j];
                const wordData: WordData = {
                    node: document.querySelector(
                        `.lyric-${i}-${j}`,
                    ) as HTMLElement,
                    prev: prevWord,
                    next: null,
                    content: word.content,
                    offset: word.offset!,
                    duration: word.duration!,
                };
                if (prevWord) {
                    prevWord.next = wordData;
                }
                prevWord = wordData;
                wordsData.push(wordData);
                gsap.set(wordData.node, {
                    '--progress': percentToProgress(
                        time >= wordData.offset ? 100 : 0,
                    ),
                });
            }
            lineData.lineAnimation = new LineAnimation(wordsData);
            if (time >= lineData.offset) {
                this.activeLines = [lineData];
            }
        }
        this.activeLines.forEach((lineData) => {
            lineData.node.classList.add(styles.active);
        });
    }

    static resetTimer() {
        this.timers.forEach((timer) => {
            clearTimeout(timer);
        });
        this.timers = [];
    }

    static scrollToLine(line: LineData) {
        gsap.to(this.scrollContainer, {
            duration: 0.8,
            scrollTo: {
                y: line.node,
                offsetY: this.scrollContainer!.clientHeight * 0.4 - 80,
            },
            ease: 'power4.out',
        });
    }

    /** 定位 */
    static seek(time: number) {
        let line = this.activeLines[this.activeLines.length - 1];
        if (time < line.offset) {
            while (true) {
                line.lineAnimation.clear();
                if (!line.prev) break;
                if (time >= line.offset) break;
                line = line.prev;
            }
        } else {
            while (true) {
                if (!line.next) break;
                if (line.next.offset > time) break;
                line = line.next;
                line.lineAnimation.finish();
            }
        }
        this.activeLines.forEach((lineData) => {
            lineData.node.classList.remove(styles.active);
        });
        line.node.classList.add(styles.active);
        this.scrollToLine(line);
        line.lineAnimation.seek(time);
        this.activeLines = [line];
    }

    /** 开启自动动画 */
    static start(getTime: () => number) {
        const time = getTime();
        this.seek(time);
        this.activeLines.forEach((lineData) => {
            lineData.lineAnimation.start(time);
        });
        this.resetTimer();
        let currentLine = this.activeLines[this.activeLines.length - 1];
        // 滚动

        while (currentLine.next) {
            currentLine = currentLine.next;
            const line = currentLine;
            const timer = setTimeout(() => {
                if (line.data.continue) {
                    this.activeLines.push(line);
                    line.node.classList.add(styles.active);
                } else {
                    this.activeLines.forEach((lineData) => {
                        setTimeout(() => {
                            lineData.node.classList.remove(styles.active);
                            lineData.lineAnimation.finish();
                        }, 100);
                    });
                    this.activeLines = [line];
                    line.node.classList.add(styles.active);
                }
                line.lineAnimation.start(getTime());
                // 滚动
                if (!line.data.continue) {
                    this.scrollToLine(line);
                }
            }, currentLine.offset - time - 400);
            this.timers.push(timer);
        }
    }

    /** 暂停自动动画 */
    static pause() {
        this.activeLines.forEach((lineData) => {
            lineData.lineAnimation.pause();
        });
        this.resetTimer();
    }

    static destroy() {
        this.pause();
        this.activeLines.forEach((lineData) => {
            lineData.lineAnimation.clear();
            lineData.node.classList.remove(styles.active);
        });
        this.activeLines = [];
    }
}

export default Animation;
