import { describe, expect, it } from 'vitest';
import { getSelectionStateFromRange } from '../../app/(apps)/luoye/components/Editor/readRenderedSelection';

function makeRange(
    text: string,
    node: object,
    prefix = '',
) {
    const startRange = {
        selectNodeContents: () => undefined,
        setEnd: () => undefined,
        toString: () => prefix,
    };
    return {
        collapsed: false,
        startContainer: node,
        endContainer: node,
        toString: () => text,
        cloneRange: () => startRange,
        getBoundingClientRect: () => ({
            right: 240,
            top: 120,
        }),
    } as unknown as Range;
}

describe('readRenderedSelection', () => {
    it('读取文档正文内的渲染文本和右上角位置', () => {
        const node = { id: 'text-node' };
        const container = {
            contains: (value: unknown) => value === node,
        } as unknown as HTMLElement;
        const range = makeRange('选中的段落', node, '前缀内容');

        expect(getSelectionStateFromRange(container, range)).toEqual({
            text: '选中的段落',
            start: 4,
            end: 9,
            x: 240,
            y: 110,
        });
    });

    it('忽略文档正文之外的选区', () => {
        const node = { id: 'outside-node' };
        const container = {
            contains: () => false,
        } as unknown as HTMLElement;

        expect(
            getSelectionStateFromRange(
                container,
                makeRange('侧栏中的文字', node),
            ),
        ).toBeNull();
    });

    it('忽略空白选区', () => {
        const node = { id: 'text-node' };
        const container = {
            contains: (value: unknown) => value === node,
        } as unknown as HTMLElement;

        expect(
            getSelectionStateFromRange(
                container,
                makeRange('   \n ', node),
            ),
        ).toBeNull();
    });
});
