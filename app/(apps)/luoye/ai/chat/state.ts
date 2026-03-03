/**
 * 全局 AbortController 映射表，用于管理正在进行的流式响应
 * key: sessionId, value: AbortController
 */
export const streamControllers = new Map<string, AbortController>();
