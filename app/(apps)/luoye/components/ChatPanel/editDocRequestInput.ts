import {
    EditDocRequestToolCallMessage,
    EditDocRequestToolInput,
} from '../../ai/chat/types';

function parseJsonObject(value: string): Record<string, unknown> | null {
    try {
        const parsed: unknown = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

function findRequestPayload(value: unknown, depth = 0): Record<string, unknown> | null {
    if (depth > 4 || value == null) return null;

    if (typeof value === 'string') {
        const parsed = parseJsonObject(value);
        return parsed && 'docId' in parsed && 'baseUpdatedAt' in parsed
            ? parsed
            : null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;

    if (
        typeof record.docId === 'string' &&
        typeof record.baseUpdatedAt === 'number'
    ) {
        return record;
    }

    return (
        findRequestPayload(record.input, depth + 1) ??
        findRequestPayload(record.output, depth + 1) ??
        findRequestPayload(record.content, depth + 1) ??
        findRequestPayload(record.kwargs, depth + 1)
    );
}

function findToolArgs(value: unknown, depth = 0): Record<string, unknown> | null {
    if (depth > 4 || value == null) return null;

    if (typeof value === 'string') {
        const parsed = parseJsonObject(value);
        return parsed && 'content' in parsed ? parsed : null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;

    if (typeof record.content === 'string') {
        return record;
    }

    return findToolArgs(record.input, depth + 1);
}

export function parseEditDocRequestInput(
    tool: EditDocRequestToolCallMessage,
): EditDocRequestToolInput | null {
    const payload = findRequestPayload(tool.content) ?? findRequestPayload(tool.output);
    const args = findToolArgs(tool.input);
    if (!payload || !args || typeof args.content !== 'string') return null;

    const record = {
        ...payload,
        ...args,
        docId: payload.docId,
        baseUpdatedAt: payload.baseUpdatedAt,
        content: args.content,
    } as Partial<EditDocRequestToolInput>;

    if (
        typeof record.docId !== 'string' ||
        typeof record.baseUpdatedAt !== 'number' ||
        typeof record.content !== 'string'
    ) {
        return null;
    }

    return {
        docId: record.docId,
        baseUpdatedAt: record.baseUpdatedAt,
        content: record.content,
        ...(typeof record.summary === 'string'
            ? { summary: record.summary }
            : {}),
    };
}
