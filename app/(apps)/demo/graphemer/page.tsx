'use client';

import { Input } from '@/components/form';
import Graphemer from 'graphemer';
import { useState } from 'react';

const splitter = new Graphemer();

const Page = () => {
    const [value, setValue] = useState('');

    const length = splitter.splitGraphemes(value).length;

    return (
        <div className="w-[100vw] h-[100vh] flex items-center justify-center">
            <div className="flex items-center justify-center w-[400px]">
                <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <div className="shrink-0 ml-4 w-[100px]">长度：{length}</div>
            </div>
        </div>
    );
};

export default Page;
