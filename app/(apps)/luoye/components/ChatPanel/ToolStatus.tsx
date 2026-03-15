import { ToolCallMessage } from '../../ai/chat/types';
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

function getSearchDocsText(tool: ToolCallMessage) {
    const args = parseToolArgs(tool.input);
    const keyword = (args.keyword as string) || '...';

    if (tool.content == null) {
        return `正在搜索 “${keyword}” ...`;
    }

    if (tool.content === '没有找到相关文档。') {
        return `搜索 “${keyword}” 搜到 0 个结果`;
    }

    const count = tool.content.split('\n---\n').length;
    return `搜索 “${keyword}” 搜到 ${count} 个结果`;
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

const ToolStatus = ({ tool }: { tool: ToolCallMessage }) => {
    let text: string;

    switch (tool.name) {
        case 'search_docs':
            text = getSearchDocsText(tool);
            break;
        case 'read_doc':
            text = getReadDocText(tool);
            break;
        default:
            text = tool.content != null ? `${tool.name} 完成` : `${tool.name}…`;
    }

    return <div className={styles.toolStatus}>{text}</div>;
};

export default ToolStatus;
