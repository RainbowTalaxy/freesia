import { ChatSession, ChatSessionMessage } from '@/api/types/luoye';
import { Message } from '../../ai/chat/types';

function isInitialReadDocMessage(message: ChatSessionMessage, index: number) {
    if (index !== 0 || message.type !== 'assistant_message') return false;
    const [textPart, toolPart] = message.parts;
    return (
        message.parts.length === 2 &&
        textPart?.type === 'text' &&
        textPart.content === '' &&
        toolPart?.type === 'tool_call' &&
        toolPart.toolName === 'read_doc'
    );
}

export function convertSessionToMessages(session: ChatSession): Message[] {
    return session.messages
        .filter((message, index) => !isInitialReadDocMessage(message, index))
        .map((message) => {
            if (message.type === 'user_message') {
                return {
                    id: message.messageId,
                    role: 'user' as const,
                    content: message.content,
                    createdAt: message.createdAt,
                };
            }

            return {
                id: message.messageId,
                role: 'assistant' as const,
                content: message.parts.map((item) => {
                    if (item.type === 'text') {
                        return {
                            id: item.partId,
                            role: 'assistant' as const,
                            content: item.content,
                            createdAt: item.createdAt,
                        };
                    }
                    return {
                        run_id: item.runId,
                        role: 'tool' as const,
                        name: item.toolName,
                        input: item.input,
                        content: item.status ?? item.content,
                    };
                }),
                createdAt: message.createdAt,
            };
        });
}
