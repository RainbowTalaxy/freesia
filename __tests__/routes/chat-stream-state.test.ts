import { describe, expect, it } from 'vitest';
import { ChatStreamState } from '../../app/(apps)/luoye/components/ChatPanel/stream-state';

describe('ChatStreamState', () => {
    it('retains reasoning-only rounds on done and freezes previous snapshots', () => {
        const state = new ChatStreamState();
        state.consume({ type: 'reasoning', messageId: 'a', content: '思考' });
        const previous = state.snapshot();
        expect(previous[0]).toHaveProperty('isThinking', true);
        state.consume({ type: 'reasoning', messageId: 'a', content: '继续' });
        state.consume({ type: 'message_end', messageId: 'a' });
        state.consume({ type: 'done', messageId: 'response' });
        expect(previous[0]).toHaveProperty('reasoningContent', '思考');
        expect(state.snapshot()).toMatchObject([{ reasoningContent: '思考继续', content: '', isThinking: false }]);
        expect(state.messageId).toBe('response');
    });

    it('body/tool start ends thinking; out-of-order tool completion does not reorder parts', () => {
        const state = new ChatStreamState();
        state.consume({ type: 'reasoning', messageId: 'a', content: 'first' });
        state.consume({ type: 'message', messageId: 'a', content: 'text' });
        expect(state.snapshot()[0]).toHaveProperty('isThinking', false);
        for (const id of ['1', '2']) state.consume({ type: 'tool_start', run_id: id, name: 'lookup', input: {} });
        state.consume({ type: 'tool_end', run_id: '2', name: 'lookup', input: {}, content: 'second' });
        state.consume({ type: 'tool_end', run_id: '1', name: 'lookup', input: {}, content: 'first' });
        state.consume({ type: 'reasoning', messageId: 'b', content: 'next' });
        expect(state.snapshot().map((part) => part.role === 'tool' ? part.run_id : part.id)).toEqual(['a', '1', '2', 'b']);
        expect(state.snapshot()[3]).toHaveProperty('isThinking', true);
    });

    it.each(['error', 'disconnect'])('%s retains partial reasoning and ends thinking exactly once', (type) => {
        const state = new ChatStreamState();
        state.consume({ type: 'reasoning', messageId: 'a', content: 'partial' });
        if (type === 'error') state.consume({ type: 'error', message: 'save failed' });
        else state.finish('连接已中断');
        state.finish('duplicate');
        state.consume({ type: 'message', messageId: 'a', content: 'late' });
        expect(state.snapshot()).toHaveLength(2);
        expect(state.snapshot()[0]).toMatchObject({ reasoningContent: 'partial', content: '', isThinking: false });
    });
});
