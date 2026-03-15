export type SseEventData =
    | {
          type: 'session';
          sessionId: string;
          messageId?: string;
      }
    | {
          type: 'message';
          messageId: string;
          content: string;
      }
    | {
          type: 'tool_start';
          run_id: string;
          name: string;
          input: Record<string, unknown>;
      }
    | {
          type: 'tool_end';
          run_id: string;
          name: string;
          input: Record<string, unknown>;
          content: string;
      }
    | {
          type: 'done';
          messageId: string;
      }
    | {
          type: 'error';
          message: string;
      };

export enum SseEventStreamEvent {
    OnChatModelStart = 'on_chat_model_start',
    OnChatModelStream = 'on_chat_model_stream',
    OnChatModelEnd = 'on_chat_model_end',
    OnToolStart = 'on_tool_start',
    OnToolEnd = 'on_tool_end',
    OnError = 'on_error',
    OnDone = 'on_done',
}

export interface UserMessage {
    id: string;
    role: 'user';
    content: string;
    createdAt: number;
}

export interface AssistantChatMessage {
    id: string;
    role: 'assistant';
    content: string;
    createdAt: number;
}

export interface ToolCallMessage {
    run_id: string;
    role: 'tool';
    /** 工具名 */
    name: string;
    /** 输入参数 */
    input: Record<string, unknown>;
    /** 调用结果 */
    content?: string;
}

export interface AssistantMessage {
    id: string;
    role: 'assistant';
    content: Array<AssistantChatMessage | ToolCallMessage>;
    createdAt: number;
}

export type Message = UserMessage | AssistantMessage;
