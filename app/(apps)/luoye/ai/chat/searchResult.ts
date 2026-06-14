export const SEARCH_DOCS_EMPTY_RESULT = '没有找到相关文档。';
export const EMPTY_SEARCH_WARNING_THRESHOLD = 3;

export function isSearchDocsEmptyResult(content: string) {
    return content.startsWith(SEARCH_DOCS_EMPTY_RESULT);
}

export function formatEmptySearchResult(consecutiveEmptySearchCount: number) {
    if (consecutiveEmptySearchCount < EMPTY_SEARCH_WARNING_THRESHOLD) {
        return SEARCH_DOCS_EMPTY_RESULT;
    }

    return [
        SEARCH_DOCS_EMPTY_RESULT,
        '',
        `提示：你已经连续 ${consecutiveEmptySearchCount} 次搜索没有结果。`,
        '请确认继续搜索是否有新的明确线索。',
        '如果只是在为同一个开放猜测更换近义词，请停止搜索，直接说明不确定，并给出已有依据。',
    ].join('\n');
}
