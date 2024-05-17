export const countText = (text: string) => {
    // 清除所有空白字符，然后计算长度
    return text.replace(/\s/g, '').length;
};
