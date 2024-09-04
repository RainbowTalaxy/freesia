export interface Line {
    /** 轨道 */
    track: number;
    /** 歌词内容 */
    main: Array<{
        content: string;
        offset: number | null;
        duration: number | null;
    }>;
    /** 是否与上句连贯 */
    continue: boolean;
    /** 副歌词 */
    subs: Array<{
        track: number;
        main: Array<{
            content: string;
            offset: number | null;
            duration: number | null;
        }>;
    }>;
}

export interface Lyric {
    /** 数据版本 */
    version: string;
    data: Array<Line>;
    footer: string;
}
