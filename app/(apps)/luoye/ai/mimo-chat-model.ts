import { ChatOpenAI, ChatOpenAICompletions } from '@langchain/openai';
import { isAIMessage, type BaseMessage } from '@langchain/core/messages';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type OpenAI from 'openai';

const reasoningMetadata = Symbol('mimo-reasoning');
type ReasoningEntry = { reasoning?: string; toolIds: (string | undefined)[] };
type RequestOptions = OpenAI.RequestOptions & { [reasoningMetadata]?: ReasoningEntry[] };

function collectReasoning(messages: BaseMessage[]): ReasoningEntry[] {
    // reasoning_content 可选：模型/历史未产出推理时仅不回传该字段，不阻断工具调用（MiMo 不强制）。
    return messages.filter(isAIMessage).map((message) => ({
        reasoning:
            typeof message.additional_kwargs.reasoning_content === 'string'
                ? message.additional_kwargs.reasoning_content
                : undefined,
        toolIds: (message.tool_calls ?? []).map((call) => call.id),
    }));
}

export class MimoChatCompletions extends ChatOpenAICompletions {
    override _generate(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun) {
        return super._generate(messages, {
            ...options,
            options: { ...options.options, [reasoningMetadata]: collectReasoning(messages) } as RequestOptions,
        }, runManager);
    }

    override async *_streamResponseChunks(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun) {
        const callOptions = { ...options, [reasoningMetadata]: collectReasoning(messages) };
        yield* super._streamResponseChunks(messages, callOptions, runManager);
    }

    override completionWithRetry(request: OpenAI.Chat.ChatCompletionCreateParamsStreaming, options?: OpenAI.RequestOptions): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>>;
    override completionWithRetry(request: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, options?: OpenAI.RequestOptions): Promise<OpenAI.Chat.Completions.ChatCompletion>;
    override completionWithRetry(
        request: OpenAI.Chat.ChatCompletionCreateParams,
        options?: RequestOptions,
    ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> | OpenAI.Chat.Completions.ChatCompletion> {
        const { [reasoningMetadata]: entries, ...requestOptions } = options ?? {};
        // 流式 options 可能也包含 _generate 的嵌套 options；内部元数据不能进入 SDK。
        if ('options' in requestOptions && requestOptions.options) {
            const { [reasoningMetadata]: _, ...nested } = requestOptions.options as RequestOptions;
            requestOptions.options = nested;
        }
        let index = 0;
        const messages = request.messages.map((message) => {
            if (message.role !== 'assistant') return message;
            const entry = entries?.[index++];
            if (!entry) throw new Error('MiMo assistant 消息映射不完整');
            const toolIds = (message.tool_calls ?? []).map((call) => call.id);
            if (toolIds.length !== entry.toolIds.length || toolIds.some((id, i) => id !== entry.toolIds[i])) {
                throw new Error('MiMo 工具调用与推理消息不匹配');
            }
            return entry.reasoning !== undefined
                ? { ...message, reasoning_content: entry.reasoning }
                : { ...message };
        });
        if (entries && index !== entries.length) throw new Error('MiMo assistant 消息数量不匹配');
        return request.stream
            ? super.completionWithRetry({ ...request, messages, stream: true }, requestOptions)
            : super.completionWithRetry({ ...request, messages, stream: false }, requestOptions);
    }
}

export function createMimoChatModel(fields: ConstructorParameters<typeof ChatOpenAICompletions>[0]) {
    return new ChatOpenAI({ ...fields, completions: new MimoChatCompletions(fields) });
}
