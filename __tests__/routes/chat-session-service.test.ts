import { describe, expect, it, vi } from 'vitest';
import type { ChatSession } from '../../app/files/luoye/chat';
import { mergeLocalModelContent, toBackendMessage, toLocalMessage } from '../../app/(apps)/luoye/ai/chat/session-service';

vi.mock('@/api/fetch/server', () => ({ default: vi.fn() }));

function session(reasoningContent?: string): ChatSession {
    return {
        schemaVersion: 1, sessionId: 'session', userId: 'user', title: 'test', createdAt: 1, updatedAt: 1,
        messages: [{
            messageId: 'assistant', role: 'assistant', createdAt: 1,
            content: [{
                messageId: 'part', role: 'assistant', createdAt: 1, content: '',
                reasoningContent,
                toolCalls: [{ id: 'call', name: 'lookup', args: { query: 'q' } }],
            }],
        }],
    };
}

describe('reasoning persistence mapping', () => {
    it.each(['original\n推理', ''])('preserves exact reasoning %j and tool calls through round-trip', (reasoning) => {
        const source = session(reasoning).messages[0];
        expect(toLocalMessage(toBackendMessage(source))).toEqual(source);
    });

    it('merges missing local fields by message/part ID while preserving backend empty strings', () => {
        const local = session('local reasoning');
        const remote = session();
        const content = remote.messages[0];
        if (content.role !== 'assistant' || content.content[0].role !== 'assistant') throw new Error();
        delete content.content[0].toolCalls;
        const merged = mergeLocalModelContent(remote, local);
        expect(merged.messages[0]).toEqual(local.messages[0]);
        expect(mergeLocalModelContent(session(''), local).messages[0]).toEqual(session('').messages[0]);
        const different = session();
        different.messages[0].messageId = 'different';
        expect(mergeLocalModelContent(different, local).messages[0]).not.toEqual(local.messages[0]);
    });
});
