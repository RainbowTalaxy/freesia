import { describe, expect, it } from 'vitest';
import type { EditDocRequestToolCallMessage } from '../../app/(apps)/luoye/ai/chat/types';
import { parseEditDocRequestInput } from '../../app/(apps)/luoye/components/ChatPanel/editDocRequestInput';

const argsInput = {
    input: JSON.stringify({
        content: '你好\n\n新的内容',
        summary: '补充内容',
    }),
};

const requestPayload = {
    status: 'pending',
    docId: 'doc-edit',
    baseUpdatedAt: 42,
    content: '你好\n\n新的内容',
    summary: '补充内容',
};

describe('parseEditDocRequestInput', () => {
    it('应解析工具参数中的嵌套 input', () => {
        const tool: EditDocRequestToolCallMessage = {
            run_id: 'run-1',
            role: 'tool',
            name: 'edit_doc_request',
            input: argsInput,
            content: JSON.stringify(requestPayload),
        };

        expect(parseEditDocRequestInput(tool)).toEqual({
            docId: 'doc-edit',
            baseUpdatedAt: 42,
            content: '你好\n\n新的内容',
            summary: '补充内容',
        });
    });

    it('确认后 content 被状态覆盖时仍可从 output 恢复元数据', () => {
        const tool: EditDocRequestToolCallMessage = {
            run_id: 'run-2',
            role: 'tool',
            name: 'edit_doc_request',
            input: argsInput,
            content: 'confirmed',
            output: {
                kwargs: {
                    content: JSON.stringify(requestPayload),
                },
            },
        };

        expect(parseEditDocRequestInput(tool)).toMatchObject({
            docId: 'doc-edit',
            baseUpdatedAt: 42,
            content: '你好\n\n新的内容',
        });
    });

    it('缺少固定元数据时返回 null', () => {
        const tool: EditDocRequestToolCallMessage = {
            run_id: 'run-3',
            role: 'tool',
            name: 'edit_doc_request',
            input: argsInput,
            content: JSON.stringify({ content: '你好' }),
        };

        expect(parseEditDocRequestInput(tool)).toBeNull();
    });
});
