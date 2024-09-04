/**
 * 功能点：
 * * 行编辑
 *   1. 拆分/合并词
 *   2. 设置行的信息（轨道/是否连续/子歌词）
 *   3. 添加/删除行
 * * 词编辑
 *   1. 编辑词的信息（内容/开始时间/持续时间）
 *   2. 实时预览效果
 *   3. 定位播放
 *   4. 按词/句清除记录
 *   5. 按行定位播放
 * * 记录
 *   1. 记录词的开始时间/持续时间
 *   2. 高亮已记录的内容
 *   3. 按词/句清除记录
 *   4. 简单显示记录的数据
 *   5. 按词/行定位播放
 */

'use client';
import clsx from 'clsx';
import styles from './style.module.css';
import { Line } from './types';
import { Fragment, useState } from 'react';
import LineAttrsForm from '../LineForm';
import useLyricStore, { Mode } from './useLyricStore';
import { useAudioStore } from '../AudioController';

interface Props {
    mode: Mode;
    line: Line;
    lineIdx: number;
}

export const LINE_RECORD_CLASSNAME = 'line-record';

const LineEditor = ({ mode, line, lineIdx }: Props) => {
    const [isLineFormVisible, setLineFormVisible] = useState(false);
    const clearLineRecord = useLyricStore((state) => state.clearLineRecord);

    const isRecording = mode === 'record';

    return (
        <>
            <div
                className={clsx(styles.line, LINE_RECORD_CLASSNAME)}
                onClick={() => {
                    if (isRecording) return;
                    const { seek, ref } = useAudioStore.getState();
                    seek(line.main[0].offset ?? 0);
                    ref?.play();
                }}
            >
                <div className={styles.lineText}>
                    {line.main.map((word, index) => {
                        const endWithSpace = word.content.endsWith(' ');
                        const hasNext = index < line.main.length - 1;
                        const isActive = word.offset !== null && word.duration !== null;
                        return (
                            <Fragment key={index}>
                                <span
                                    className={clsx(
                                        styles.lineWord,
                                        `lyric-word-${lineIdx}-${index}`,
                                        isActive && styles.active,
                                    )}
                                >
                                    {word.content.trim()}
                                </span>
                                {hasNext &&
                                    (endWithSpace ? (
                                        <span className={styles.space} />
                                    ) : (
                                        <span className={styles.break}>·</span>
                                    ))}
                            </Fragment>
                        );
                    })}
                </div>
                {isRecording && (
                    <button
                        className={clsx(styles.lineAction, styles.danger)}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            clearLineRecord(line);
                        }}
                    >
                        清除
                    </button>
                )}
                {!isRecording && (
                    <button
                        className={styles.lineAction}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLineFormVisible(true);
                        }}
                    >
                        编辑
                    </button>
                )}
            </div>
            {isLineFormVisible && <LineAttrsForm line={line} onClose={() => setLineFormVisible(false)} />}
        </>
    );
};

export default LineEditor;
