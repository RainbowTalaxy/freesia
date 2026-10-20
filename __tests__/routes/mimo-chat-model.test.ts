import { describe, expect, it } from 'vitest';
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { createMimoChatModel } from '../../app/(apps)/luoye/ai/mimo-chat-model';

const tools = [{ type: 'function' as const, function: {
    name: 'lookup', description: 'Test lookup', parameters: { type: 'object', properties: {} },
} }];

function history(reasoning: string) {
    return [
        new HumanMessage('lookup'),
        new AIMessage({
            content: '',
            tool_calls: [{ id: `call-${reasoning}`, name: 'lookup', args: {} }],
            additional_kwargs: { reasoning_content: reasoning },
        }),
        new ToolMessage({ tool_call_id: `call-${reasoning}`, content: '42' }),
    ];
}

function transport() {
    const requests: Record<string, any>[] = [];
    const model = createMimoChatModel({
        apiKey: 'test-key', model: 'mimo-v2.6-flash', maxRetries: 0,
        modelKwargs: { thinking: { type: 'enabled' } },
        configuration: {
            fetch: async (_url, init) => {
                const body = JSON.parse(String(init?.body));
                requests.push(body);
                if (body.stream) {
                    const frame = (delta: object, finish_reason: string | null = null) => `data: ${JSON.stringify({
                        id: 'response', object: 'chat.completion.chunk', created: 1, model: body.model,
                        choices: [{ index: 0, delta, finish_reason }],
                    })}\n\n`;
                    return new Response(
                        frame({ role: 'assistant', reasoning_content: '计算' }) +
                        frame({ content: '42' }, 'stop') + 'data: [DONE]\n\n',
                        { headers: { 'Content-Type': 'text/event-stream' } },
                    );
                }
                return Response.json({
                    id: 'response', object: 'chat.completion', created: 1, model: body.model,
                    choices: [{ index: 0, message: { role: 'assistant', content: '42', reasoning_content: '计算' }, finish_reason: 'stop' }],
                    usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
                });
            },
        },
    });
    return { model, requests };
}

describe('MiMo HTTP request adaptation', () => {
    it('non-streaming invoke and withConfig preserve reasoning and tool IDs', async () => {
        const { model, requests } = transport();
        const input = history('original\n推理');
        const result = await model.withConfig({ tags: ['configured'] }).invoke(input);
        expect(result.content).toBe('42');
        expect(requests[0].messages[1]).toMatchObject({
            reasoning_content: 'original\n推理',
            tool_calls: [{ id: 'call-original\n推理' }],
        });
        expect(input[1].additional_kwargs.reasoning_content).toBe('original\n推理');
        expect(requests[0].thinking).toEqual({ type: 'enabled' });
        expect(JSON.stringify(requests[0])).not.toContain('mimo-reasoning');
    });

    it('streaming bindTools retains incoming reasoning and sends original reasoning', async () => {
        const { model, requests } = transport();
        let content = '';
        let reasoning = '';
        for await (const chunk of await model.bindTools(tools).stream(history('stream-reasoning'))) {
            content += chunk.content;
            reasoning += chunk.additional_kwargs.reasoning_content ?? '';
        }
        expect(content).toBe('42');
        expect(reasoning).toBe('计算');
        expect(requests[0].messages[1].reasoning_content).toBe('stream-reasoning');
        expect(requests[0].tools).toHaveLength(1);
    });

    it('concurrent invocations on one model cannot cross-contaminate histories', async () => {
        const { model, requests } = transport();
        await Promise.all(['a', 'b'].map((reasoning) => model.invoke(history(reasoning))));
        for (const request of requests) {
            const assistant = request.messages[1];
            expect(assistant.tool_calls[0].id).toBe(`call-${assistant.reasoning_content}`);
        }
        expect(requests).toHaveLength(2);
    });

    it('distinguishes an empty reasoning string from an absent field', async () => {
        const { model, requests } = transport();
        await model.invoke(history(''));
        expect(requests[0].messages[1].reasoning_content).toBe('');
        await model.invoke([new AIMessage('ordinary history'), new HumanMessage('continue')]);
        expect(requests[1].messages[0]).not.toHaveProperty('reasoning_content');
    });

    it('sends a tool round without reasoning_content when the model produced none', async () => {
        const { model, requests } = transport();
        const input = history('missing');
        delete input[1].additional_kwargs.reasoning_content;
        const result = await model.invoke(input);
        expect(result.content).toBe('42');
        expect(requests).toHaveLength(1);
        const assistant = requests[0].messages[1];
        expect(assistant.tool_calls[0]).toMatchObject({ id: 'call-missing' });
        // 历史没有推理时不回传该字段，而不是报错中断
        expect(assistant).not.toHaveProperty('reasoning_content');
        expect(input[1].additional_kwargs.reasoning_content).toBeUndefined();
    });
});
