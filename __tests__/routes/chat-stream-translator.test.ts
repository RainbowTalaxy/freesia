import { describe, expect, it } from 'vitest';
import { ChatStreamTranslator } from '../../app/(apps)/luoye/ai/chat/stream-translator';
import ChatFile from '../../app/files/luoye/chat';

function event(event: string, run_id: string, data: Record<string, unknown> = {}, name = 'model') {
    return { event, run_id, data, name, metadata: {} };
}

describe('ChatStreamTranslator', () => {
    it('receives reasoning and text independently and only supplements missing final suffixes', () => {
        const translator = new ChatStreamTranslator(ChatFile.newAssistantMessage());
        translator.consume(event('on_chat_model_start', 'a'));
        const chunks = translator.consume(event('on_chat_model_stream', 'a', {
            chunk: { content: '答', additional_kwargs: { reasoning_content: '思考' } },
        }));
        expect(chunks.map((chunk) => chunk.type)).toEqual(['reasoning', 'message']);
        expect(chunks[0]).toHaveProperty('messageId', (chunks[1] as any).messageId);
        const final = translator.consume(event('on_chat_model_end', 'a', {
            output: { content: '答案', additional_kwargs: { reasoning_content: '思考' } },
        }));
        expect(final.map((chunk) => chunk.type)).toEqual(['message', 'message_end']);
        expect(final[0]).toHaveProperty('content', '案');
        expect(translator.message.content[0]).toMatchObject({ content: '答案', reasoningContent: '思考' });
    });

    it('retains reasoning-only output and handles null/empty fields', () => {
        const translator = new ChatStreamTranslator(ChatFile.newAssistantMessage());
        translator.consume(event('on_chat_model_start', 'a'));
        expect(translator.consume(event('on_chat_model_stream', 'a', {
            chunk: { content: null, additional_kwargs: { reasoning_content: null } },
        }))).toEqual([]);
        translator.consume(event('on_chat_model_stream', 'a', {
            chunk: { content: null, additional_kwargs: { reasoning_content: 'only thought' } },
        }));
        translator.consume(event('on_chat_model_end', 'a', { output: { content: '' } }));
        expect(translator.message.content[0]).toMatchObject({ content: '', reasoningContent: 'only thought' });
    });

    it('maps multiple model rounds and parallel tool completions to their original positions', () => {
        const translator = new ChatStreamTranslator(ChatFile.newAssistantMessage());
        translator.consume(event('on_chat_model_start', 'a'));
        const calls = ['1', '2'].map((id) => ({ id, name: 'lookup', args: {} }));
        translator.consume(event('on_chat_model_end', 'a', {
            output: { content: '', additional_kwargs: { reasoning_content: 'lookup first' }, tool_calls: calls },
        }));
        for (const id of ['1', '2']) translator.consume(event('on_tool_start', id, { input: {} }, 'lookup'));
        for (const id of ['2', '1']) translator.consume(event('on_tool_end', id, { input: {}, output: { content: id, tool_call_id: id } }, 'lookup'));
        translator.consume(event('on_chat_model_start', 'b'));
        translator.consume(event('on_chat_model_end', 'b', {
            output: { content: 'done', additional_kwargs: { reasoning_content: 'summarize' } },
        }));
        expect(translator.message.content.map((part) => part.role === 'tool' ? part.toolCallId : part.reasoningContent))
            .toEqual(['lookup first', '1', '2', 'summarize']);
        expect(translator.message.content[0]).toHaveProperty('toolCalls', calls);
    });

    it('keeps tool calls when the model acts without reasoning', () => {
        const translator = new ChatStreamTranslator(ChatFile.newAssistantMessage());
        translator.consume(event('on_chat_model_start', 'a'));
        const calls = [{ id: '1', name: 'lookup', args: {} }];
        let chunks: { type: string }[] = [];
        expect(() => {
            chunks = translator.consume(event('on_chat_model_end', 'a', {
                output: { content: '', tool_calls: calls },
            }));
        }).not.toThrow();
        expect(chunks.map((chunk) => chunk.type)).toEqual(['message_end']);
        expect(translator.message.content[0]).toMatchObject({ content: '', toolCalls: calls });
        expect(translator.message.content[0]).not.toHaveProperty('reasoningContent');
    });

    it('still rejects tool calls without id or divergent final content', () => {
        const noId = new ChatStreamTranslator(ChatFile.newAssistantMessage());
        noId.consume(event('on_chat_model_start', 'a'));
        expect(() => noId.consume(event('on_chat_model_end', 'a', {
            output: { tool_calls: [{ name: 'lookup', args: {} }] },
        }))).toThrow('缺少关联 ID');

        const diverged = new ChatStreamTranslator(ChatFile.newAssistantMessage());
        diverged.consume(event('on_chat_model_start', 'b'));
        diverged.consume(event('on_chat_model_stream', 'b', { chunk: { content: 'original' } }));
        expect(() => diverged.consume(event('on_chat_model_end', 'b', { output: { content: 'different' } })))
            .toThrow('最终输出与流式内容不一致');
    });

    it('drops an empty model round without persisting a blank part or emitting message_end', () => {
        const translator = new ChatStreamTranslator(ChatFile.newAssistantMessage());
        translator.consume(event('on_chat_model_start', 'empty'));
        const chunks = translator.consume(event('on_chat_model_end', 'empty', { output: { content: '' } }));
        expect(chunks).toEqual([]);
        expect(translator.message.content).toEqual([]);
    });

    it('keeps streamed reasoning when the non-standard final value diverges', () => {
        const translator = new ChatStreamTranslator(ChatFile.newAssistantMessage());
        translator.consume(event('on_chat_model_start', 'a'));
        translator.consume(event('on_chat_model_stream', 'a', {
            chunk: { content: '答案', additional_kwargs: { reasoning_content: '流式思考' } },
        }));
        let chunks: unknown[] = [];
        expect(() => {
            chunks = translator.consume(event('on_chat_model_end', 'a', {
                output: {
                    content: '答案',
                    additional_kwargs: { reasoning_content: '服务端重新聚合的不同内容' },
                },
            }));
        }).not.toThrow();
        // 正文仍是最终值的补尾结果，reasoning 保留流式累积而非被覆盖
        expect(chunks.map((chunk) => (chunk as { type: string }).type)).toEqual(['message_end']);
        expect(translator.message.content[0]).toMatchObject({
            content: '答案',
            reasoningContent: '流式思考',
        });
    });
});
