export const PLACE_HOLDER = '点击此处输入正文，可按 Ctrl + S 保存';

export const countText = (text: string) => {
    // 清除所有空白字符，然后计算长度
    return text.replace(/\s/g, '').length;
};

export type * from './types';
