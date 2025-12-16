import { Lyric } from '../data/song/[songId]/containers/LyricEditor/types';

type ParseDOMStackElement = {
    tagName?: string;
    le?: number;
    content?: string;
    begin?: number;
    end?: number;
    children: ParseDOMStackElement[];
};

const parseDOM = (str: string) => {
    const stack: ParseDOMStackElement[] = [
        {
            children: [],
        },
    ];
    let currentEle: ParseDOMStackElement | null = null;

    let i = 0;
    while (i < str.length) {
        const char = str[i];
        switch (char) {
            case '<': {
                const nextChar = str[i + 1];
                if (nextChar === '/') {
                    // 遇到结束标签
                    const content = str.slice(currentEle!.le! + 1, i);
                    if (!content.includes('<')) {
                        currentEle!.content = content;
                    }
                    for (; i < str.length; i += 1) {
                        if (str[i] === '>') break;
                    }
                    stack.pop();
                    currentEle = stack[stack.length - 1];
                } else {
                    // 遇到开始标签
                    const tagStart = i + 1;
                    for (; i < str.length; i += 1) {
                        if (str[i] === '>') break;
                    }
                    const tagNameAndAttrs = str.slice(tagStart, i);
                    const [tagName, ...attrs] = tagNameAndAttrs.split(' ');
                    currentEle = {
                        tagName,
                        le: i,
                        children: [],
                    };
                    attrs.forEach((attr) => {
                        const [key, value] = attr.split('=');
                        // @ts-ignore
                        currentEle[key] = JSON.parse(value);
                        if (key === 'begin' || key === 'end') {
                            // 值为时间，格式为 `H:M:S.xxx` ，其中 HH 和 MM 可能不存在
                            // @ts-ignore
                            const units = currentEle[key]
                                // @ts-ignore
                                .split(':')
                                .map(parseFloat);
                            // @ts-ignore
                            currentEle[key] = Math.round(
                                units.reduce(
                                    // @ts-ignore
                                    (acc, cur) => acc * 60 + cur * 1000,
                                    0,
                                ),
                            );
                        }
                    });
                    stack[stack.length - 1].children.push(currentEle);
                    stack.push(currentEle);
                }
            }
        }
        i += 1;
    }

    return stack[0].children;
};

export const parseAppleMusicLyric = (data: string): Lyric => {
    const target = data
        .match(/<body[^>]*>([\s\S]*)<\/body>/)![1]
        .replaceAll('> <', '><span> </span><');
    const json = parseDOM(target).flatMap((part) => part.children);

    const lyric = json.map((line, lineIdx) => {
        const subs = line.children
            .filter((word) => word.children.length > 0)
            .map((sub) => ({
                track: 1,
                main: sub.children.map((word) => ({
                    offset: word.begin!,
                    duration: word.end! - word.begin!,
                    content: word.content!,
                })),
            }));

        const main = line.children
            .filter((word) => word.children.length === 0)
            .map((word) => ({
                offset: word.begin!,
                duration: word.end! - word.begin!,
                content: word.content!,
            }));

        // 如果存在 word 为空格，需要合并到前一个 word
        main.forEach((word, index) => {
            if (word.content === ' ') {
                main[index - 1].content += ' ';
                main.splice(index, 1);
            }
        });

        subs.forEach((sub) => {
            sub.main.forEach((word, index) => {
                if (word.content === ' ') {
                    sub.main[index - 1].content += ' ';
                    sub.main.splice(index, 1);
                }
            });
        });

        return {
            track: 1,
            // 歌词主体
            main,
            // 如果这一句的开始比上一句的结束晚，则标记为 true
            continue: lineIdx > 0 && line.begin! < json[lineIdx - 1].end!,
            // 副歌词
            subs,
        };
    });

    return {
        version: '1.0.0',
        data: lyric,
        footer: '',
        source: 'apple-music',
    };
};
