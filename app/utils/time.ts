import dayjs from 'dayjs';

// 表单日期转为 number
export function time(form: string) {
    return dayjs(form).valueOf();
}

// 今日时间（表单用）
export function formDate(date?: number) {
    return dayjs(date).format('YYYY-MM-DD');
}
