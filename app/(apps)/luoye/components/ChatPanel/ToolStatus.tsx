import { SaveDocRequestToolCallMessage, ToolCallMessage } from '../../ai/chat/types';
import { isSearchDocsEmptyResult } from '../../ai/chat/searchResult';
import SaveDocRequest from './SaveDocRequest';
import styles from './ChatPanel.module.css';

function parseToolArgs(input: Record<string, unknown>): Record<string, unknown> {
    if (typeof input.input === 'string') {
        try {
            return JSON.parse(input.input);
        } catch {
            return input;
        }
    }
    return input;
}

const SEARCH_TIME_FIELD_LABELS: Record<string, string> = {
    updatedAt: '更新时间',
    createdAt: '创建时间',
    date: '文档日期',
};

function getStringArg(args: Record<string, unknown>, key: string) {
    const value = args[key];
    return typeof value === 'string' ? value.trim() : '';
}

function getSearchTargetText(args: Record<string, unknown>) {
    const keyword = getStringArg(args, 'keyword');
    return keyword ? `搜索 “${keyword}”` : '筛选文档';
}

function getSearchTimeText(args: Record<string, unknown>) {
    const rawTimeField = getStringArg(args, 'timeField') || 'updatedAt';
    const timeLabel =
        SEARCH_TIME_FIELD_LABELS[rawTimeField] ??
        SEARCH_TIME_FIELD_LABELS.updatedAt;
    const startDate = getStringArg(args, 'startDate');
    const endDate = getStringArg(args, 'endDate');

    if (startDate && endDate) return `${timeLabel} ${startDate} 至 ${endDate}`;
    if (startDate) return `${timeLabel} ${startDate} 起`;
    if (endDate) return `${timeLabel} ${endDate} 前`;
    if (rawTimeField !== 'updatedAt') return `按${timeLabel}筛选`;
    return '';
}

function getSearchSummaryPrefix(args: Record<string, unknown>) {
    const target = getSearchTargetText(args);
    const timeText = getSearchTimeText(args);
    return timeText ? `${target}（${timeText}）` : target;
}

function getSearchResultCount(content: string) {
    const totalMatch = content.match(/^共找到\s+(\d+)\s+个文档，展示前\s+(\d+)\s+个。/);
    if (totalMatch) return Number(totalMatch[1]);
    return content.match(/^文档「/gm)?.length ?? 0;
}

function getSearchDocsText(tool: ToolCallMessage) {
    const args = parseToolArgs(tool.input);
    const summaryPrefix = getSearchSummaryPrefix(args);

    if (tool.content == null) {
        return `正在${summaryPrefix} ...`;
    }

    if (isSearchDocsEmptyResult(tool.content)) {
        return `${summaryPrefix}搜到 0 个结果`;
    }

    const count = getSearchResultCount(tool.content);
    return `${summaryPrefix}搜到 ${count} 个结果`;
}

function getReadDocText(tool: ToolCallMessage) {
    const args = parseToolArgs(tool.input);
    const docId = (args.docId as string) || '...';

    if (tool.content == null) {
        return `正在翻阅文档...`;
    }

    const titleMatch = tool.content.match(/^文档标题：(.+)/);
    const title = titleMatch ? titleMatch[1] : docId;
    return `已阅读《${title}》`;
}

const ToolStatus = ({ tool, sessionId }: { tool: ToolCallMessage; sessionId: string | null }) => {
    if (tool.name === 'save_doc_request') {
        return <SaveDocRequest tool={tool as SaveDocRequestToolCallMessage} sessionId={sessionId} />;
    }

    let text: string;

    switch (tool.name) {
        case 'search_docs':
            text = getSearchDocsText(tool);
            break;
        case 'read_doc':
            text = getReadDocText(tool);
            break;
        case 'get_current_time':
            text = tool.content != null ? `已获取到当前时间` : '正在获取当前时间...';
            break;
        default:
            text = tool.content != null ? `${tool.name} 完成` : `${tool.name}…`;
    }

    return <div className={styles.toolStatus}>{text}</div>;
};

export default ToolStatus;
