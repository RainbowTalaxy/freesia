'use client';

import API, { clientFetch } from '@/api';
import { Input } from '@/components/form';
import { formDate } from '@/utils';
import { useEffect, useState } from 'react';

const LogPanel = () => {
    const [date, setDate] = useState(formDate());
    const [log, setLog] = useState('');

    useEffect(() => {
        clientFetch(API.support.admin.log(date)).then((data) =>
            setLog(data.log.trim().split('\n').reverse().join('\n')),
        );
    }, [date]);

    return (
        <div>
            <Input
                className="mb-4"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />
            <pre>{log}</pre>
        </div>
    );
};

export default LogPanel;
