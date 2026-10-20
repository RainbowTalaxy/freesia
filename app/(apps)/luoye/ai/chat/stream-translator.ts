import type { StreamEvent } from '@langchain/core/tracers/log_stream';
import { ChatFile } from '@/files';
import type { ChatSessionAssistantChatMessage, ChatSessionToolCallMessage } from '@/files/luoye/chat';
import { SseEventData, SseEventStreamEvent } from './types';

export class ChatStreamTranslator {
    private models = new Map<string, ChatSessionAssistantChatMessage>();
    private tools = new Map<string, ChatSessionToolCallMessage>();

    constructor(readonly message: ReturnType<typeof ChatFile.newAssistantMessage>) {}

    consume(event: StreamEvent): SseEventData[] {
        switch (event.event) {
            case SseEventStreamEvent.OnChatModelStart:
                if (!this.models.has(event.run_id)) {
                    const part = ChatFile.newAssistantChatMessage();
                    this.models.set(event.run_id, part);
                }
                return [];
            case SseEventStreamEvent.OnChatModelStream: {
                const part = this.models.get(event.run_id);
                const chunk = event.data.chunk;
                if (!part || !chunk) return [];
                const events: SseEventData[] = [];
                this.append(part, 'reasoning', chunk.additional_kwargs?.reasoning_content, events);
                this.append(part, 'message', chunk.content, events);
                return events;
            }
            case SseEventStreamEvent.OnChatModelEnd: {
                const part = this.models.get(event.run_id);
                if (!part) return [];
                const events: SseEventData[] = [];
                const output = event.data.output;
                this.complete(part, 'reasoning', output?.additional_kwargs?.reasoning_content, events);
                this.complete(part, 'message', output?.content, events);
                if (event.data.output?.tool_calls?.length) {
                    // reasoning_content 是可选的：模型可能不经过推理直接调用工具，
                    // 不能因其缺失而中断本轮；工具调用与结果的配对只依赖 tool call id。
                    part.toolCalls = event.data.output.tool_calls.map(
                        (call: { id: string; name: string; args: Record<string, unknown> }) => ({
                            id: call.id, name: call.name, args: call.args,
                        }),
                    );
                    if (part.toolCalls?.some((call) => !call.id)) {
                        throw new Error('MiMo 工具调用缺少关联 ID，已停止本轮回复。');
                    }
                }
                this.models.delete(event.run_id);
                // 仅在确实产出内容时落盘，避免未配对/空产出的 model run 留下空白片段；
                // 此时 model 已结束且先于后续 tool 事件，push 顺序与事件顺序一致。
                if (
                    part.content ||
                    part.reasoningContent !== undefined ||
                    part.toolCalls?.length
                ) {
                    this.message.content.push(part);
                    return [...events, { type: 'message_end', messageId: part.messageId }];
                }
                return events;
            }
            case SseEventStreamEvent.OnToolStart: {
                const part = ChatFile.newToolCallMessage();
                Object.assign(part, { name: event.name, runId: event.run_id, input: event.data.input });
                this.tools.set(event.run_id, part);
                this.message.content.push(part);
                return [{
                    type: 'tool_start', name: event.name, run_id: event.run_id,
                    input: event.data.input,
                }];
            }
            case SseEventStreamEvent.OnToolEnd: {
                const output = event.data.output;
                const part = this.tools.get(event.run_id) ?? ChatFile.newToolCallMessage();
                Object.assign(part, {
                    name: event.name, runId: event.run_id, input: event.data.input,
                    output, content: output?.content, toolCallId: output?.tool_call_id,
                });
                if (!this.tools.has(event.run_id)) this.message.content.push(part);
                this.tools.delete(event.run_id);
                return [{
                    type: 'tool_end', run_id: event.run_id, name: event.name,
                    input: event.data.input, content: output?.content,
                }];
            }
            default:
                return [];
        }
    }

    private append(part: ChatSessionAssistantChatMessage, type: 'reasoning' | 'message', value: unknown, events: SseEventData[]) {
        if (typeof value !== 'string') return;
        if (type === 'reasoning') part.reasoningContent = (part.reasoningContent ?? '') + value;
        else part.content += value;
        if (value) events.push({ type, messageId: part.messageId, content: value });
    }

    private complete(part: ChatSessionAssistantChatMessage, type: 'reasoning' | 'message', value: unknown, events: SseEventData[]) {
        if (typeof value !== 'string') return;
        const current = type === 'reasoning' ? part.reasoningContent ?? '' : part.content;
        if (!value.startsWith(current)) {
            // reasoning_content 是非标准字段，最终聚合形态可能随模型/框架版本变化；
            // 不一致时保留流式累积内容，不为第三方字段的形态差异丢弃整轮回复。
            if (type === 'reasoning') return;
            throw new Error('模型最终输出与流式内容不一致，回复未保存。');
        }
        this.append(part, type, value.slice(current.length), events);
    }
}
