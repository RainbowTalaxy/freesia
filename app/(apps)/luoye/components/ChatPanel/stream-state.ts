import type { AssistantChatMessage, SseEventData, ToolCallMessage } from '../../ai/chat/types';
import { generateMessageId } from '../../ai/chat/utils';

type Part = AssistantChatMessage | ToolCallMessage;

export class ChatStreamState {
    private parts: Part[] = [];
    private text = new Map<string, AssistantChatMessage>();
    private tools = new Map<string, ToolCallMessage>();
    terminal = false;
    messageId = generateMessageId();

    consume(event: SseEventData) {
        if (this.terminal) return;
        switch (event.type) {
            case 'session':
                if (event.messageId) this.messageId = event.messageId;
                break;
            case 'reasoning':
            case 'message': {
                let part = this.text.get(event.messageId);
                if (!part) {
                    part = { id: event.messageId, role: 'assistant', content: '', createdAt: Date.now() };
                    this.text.set(event.messageId, part);
                    this.parts.push(part);
                }
                if (event.type === 'reasoning') {
                    part.reasoningContent = (part.reasoningContent ?? '') + event.content;
                    if (part.isThinking === undefined) part.isThinking = true;
                } else {
                    part.content += event.content;
                    part.isThinking = false;
                }
                break;
            }
            case 'message_end': {
                const part = this.text.get(event.messageId);
                if (part) part.isThinking = false;
                break;
            }
            case 'tool_start':
            case 'tool_end': {
                this.endThinking();
                let part = this.tools.get(event.run_id);
                if (!part) {
                    part = { role: 'tool', run_id: event.run_id, name: event.name, input: event.input };
                    this.tools.set(event.run_id, part);
                    this.parts.push(part);
                }
                Object.assign(part, { name: event.name, input: event.input });
                if (event.type === 'tool_end') part.content = event.content;
                break;
            }
            case 'done':
                this.messageId = event.messageId;
                this.finish();
                break;
            case 'error':
                this.finish(`错误：${event.message}`);
                break;
        }
    }

    finish(error?: string) {
        if (this.terminal) return;
        this.endThinking();
        this.terminal = true;
        if (error) this.parts.push({
            id: generateMessageId(), role: 'assistant', content: error, createdAt: Date.now(),
        });
    }

    snapshot(): Part[] {
        return this.parts.map((part) => ({ ...part }));
    }

    private endThinking() {
        this.text.forEach((part) => { part.isThinking = false; });
    }
}
