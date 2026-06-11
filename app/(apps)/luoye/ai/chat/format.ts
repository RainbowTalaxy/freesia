import { Doc } from '@/api/types/luoye';

function formatShanghaiDateTime(value: number) {
    return new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(value);
}

function formatShanghaiDate(value: unknown) {
    if (typeof value !== 'number') return '未知';

    return new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(value);
}

export function formatCurrentTimeForPrompt() {
    return `${formatShanghaiDateTime(Date.now())} (UTC+8)`;
}

export function formatDocForReadDoc(doc: Doc) {
    return [
        `文档标题：${doc.name || '无标题'}`,
        `文档日期：${formatShanghaiDate(doc.date)}`,
        '文档内容：',
        doc.content || '(空)',
    ].join('\n');
}
