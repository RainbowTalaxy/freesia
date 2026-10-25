import { expect, it } from 'vitest';
import { convertSessionToMessages } from '../../app/(apps)/luoye/components/ChatPanel/utils';
import type { ChatSession } from '../../app/api/types/luoye';

it('hides legacy document preload, but preserves real reasoning and restores history collapsed', () => {
    const session: ChatSession = {
        schemaVersion: 1, sessionId: 's', userId: 'u', title: '', createdAt: 1, updatedAt: 1,
        messages: [{
            schemaVersion: 1, messageId: 'm', type: 'assistant_message', createdAt: 1,
            parts: [
                { schemaVersion: 1, partId: 'p', type: 'text', content: '', createdAt: 1 },
                { schemaVersion: 1, partId: 't', type: 'tool_call', toolName: 'read_doc', runId: 'run', input: {}, createdAt: 1, updatedAt: 1 },
            ],
        }],
    };
    expect(convertSessionToMessages(session)).toEqual([]);
    const message = session.messages[0];
    if (message.type !== 'assistant_message' || message.parts[0].type !== 'text') throw new Error();
    message.parts[0].reasoningContent = '真实推理';
    const result = convertSessionToMessages(session);
    expect(result).toHaveLength(1);
    expect(result[0].content[0]).toMatchObject({ id: 'p', reasoningContent: '真实推理' });
    expect(result[0].content[0]).not.toHaveProperty('isThinking', true);
});

it('restores selected document content on user messages', () => {
    const session: ChatSession = {
        schemaVersion: 1,
        sessionId: 's-selection',
        userId: 'u',
        title: '',
        createdAt: 1,
        updatedAt: 1,
        messages: [
            {
                schemaVersion: 1,
                messageId: 'm-selection',
                type: 'user_message',
                content: '改得平实一点',
                modelContent:
                    '改得平实一点\n\n用户选中的文档内容：\n<selected_text>\n花正开着，树叶被风吹得沙沙作响。\n</selected_text>',
                createdAt: 1,
            },
        ],
    };

    const [message] = convertSessionToMessages(session);
    expect(message.role).toBe('user');
    if (message.role !== 'user') throw new Error();
    expect(message.content).toBe('改得平实一点');
    expect(message.selection).toEqual({
        text: '花正开着，树叶被风吹得沙沙作响。',
        start: 0,
        end: 16,
    });
});
