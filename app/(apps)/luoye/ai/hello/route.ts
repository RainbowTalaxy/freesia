import { NextResponse } from 'next/server';
import API from '@/api';
import serverFetch from '@/api/fetch/server';
import { getMimoModel } from '../model';

export async function POST() {
    const user = await serverFetch(API.user.info(), true);
    if (!user) {
        return NextResponse.json({ message: '未登录' }, { status: 401 });
    }

    const model = getMimoModel();
    const response = await model.invoke('你好');

    return NextResponse.json({ message: response.content });
}
