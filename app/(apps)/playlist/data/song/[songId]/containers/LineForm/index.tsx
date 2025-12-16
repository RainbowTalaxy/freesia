'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Button, Toggle } from '@/components/form';
import formStyles from '../../../../styles/form.module.css';
import styles from './style.module.css';
import { Line } from '../LyricEditor/types';
import useLyricStore from '../LyricEditor/useLyricStore';

interface Props {
    line: Line;
    onClose: () => void;
}

const LineAttrsForm = ({ line, onClose }: Props) => {
    const [mergeList, setMergeList] = useState<Line['main']>([]);
    const [splitList, setSplitList] = useState<
        {
            word: Line['main'][number];
            indexes: number[];
        }[]
    >([]);
    const continueRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (line) {
            continueRef.current!.checked = line.continue;
        }
    }, [line]);

    const handleSubmit = async () => {
        const { updateLine } = useLyricStore.getState();
        const newAttrs = {
            track: line.track,
            continue: continueRef.current!.checked,
        };
        updateLine(line, {
            splitList,
            mergeList,
            attrs: newAttrs,
        });
        onClose();
    };

    const toggleMerge = (word: Line['main'][number]) => {
        setMergeList((list) => (list.includes(word) ? list.filter((w) => w !== word) : [...list, word]));
    };

    const toggleSplit = (word: Line['main'][number], index: number) => {
        setSplitList((list) => {
            const itemIndex = list.findIndex((item) => item.word === word);
            if (itemIndex === -1) {
                return [...list, { word, indexes: [index] }];
            }
            const item = list[itemIndex];
            const indexes = item.indexes.includes(index)
                ? item.indexes.filter((i) => i !== index)
                : [...item.indexes, index];
            if (indexes.length === 0) {
                return list.filter((item) => item !== list[itemIndex]);
            }
            return list.map((item, i) => (i === itemIndex ? { ...item, indexes } : item));
        });
    };

    return createPortal(
        <div className={formStyles.container}>
            <div
                className={formStyles.form}
                style={{
                    ['--field-label-width' as string]: '6em',
                    maxWidth: '800px',
                }}
            >
                <h2>行信息编辑</h2>
                <div className={clsx(formStyles.formItem)}>
                    <label>拆句：</label>
                    <div className={styles.line}>
                        {line.main.map((word, index) => {
                            const chars = word.content.split('');
                            return (
                                <Fragment key={index}>
                                    {index > 0 && (
                                        <button
                                            className={clsx(styles.divider, !mergeList.includes(word) && styles.active)}
                                            onClick={() => toggleMerge(word)}
                                        >
                                            |
                                        </button>
                                    )}
                                    {chars.map((char, index) => {
                                        const hasDivider = chars[index + 1] !== ' ' && index !== chars.length - 1;
                                        const isDividerActive = splitList.some(
                                            (item) => item.word === word && item.indexes.includes(index + 1),
                                        );
                                        return (
                                            <Fragment key={index}>
                                                <span className={clsx(styles.word, char === ' ' && styles.space)}>
                                                    {char}
                                                </span>
                                                {hasDivider && (
                                                    <button
                                                        className={clsx(
                                                            styles.divider,
                                                            isDividerActive && styles.active,
                                                        )}
                                                        onClick={() => toggleSplit(word, index + 1)}
                                                    >
                                                        |
                                                    </button>
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </Fragment>
                            );
                        })}
                    </div>
                </div>
                <div className={clsx(formStyles.formItem)}>
                    <label>与上句连续：</label>
                    <Toggle raf={continueRef} />
                </div>
                <div className={formStyles.formItem}>
                    <label></label>
                    <div className={formStyles.options}>
                        <Button type="primary" onClick={handleSubmit}>
                            确 定
                        </Button>
                        <Button onClick={onClose}>取 消</Button>
                    </div>
                </div>
            </div>
            <div className={formStyles.mask} onClick={onClose} />
        </div>,
        document.body,
    );
};

export default LineAttrsForm;
