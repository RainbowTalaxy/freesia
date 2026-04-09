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

/** `save_doc_request` tool 的输入参数，表示 agent 发起的文档保存请求 */
export interface SaveDocRequestToolInput {
    [key: string]: unknown;
    title: string;
    content: string; // Markdown 格式
}

/** agent 发起文档保存请求的 tool call 消息，前端据此渲染确认表单 */
export interface SaveDocRequestToolCallMessage extends ToolCallMessage {
    name: 'save_doc_request';
    input: SaveDocRequestToolInput;
    /** pending: 待用户确认；confirmed: 用户已确认；cancelled: 用户已取消 */
    content?: 'pending' | 'confirmed' | 'cancelled';
}

export interface AssistantMessage {
    id: string;
    role: 'assistant';
    content: Array<AssistantChatMessage | ToolCallMessage>;
    createdAt: number;
}

export type Message = UserMessage | AssistantMessage;
