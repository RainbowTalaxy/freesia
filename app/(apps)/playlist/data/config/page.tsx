'use client';
import API, { clientFetch } from '@/api';
import { Config } from '@/api/playlist';
import { Button, Input } from '@/components/form';
import { Logger } from '@/utils';
import { useEffect, useRef, useState } from 'react';

export default function Page() {
    const [config, setConfig] = useState<Config>();
    const resourcePrefixInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        document.title = '播放列表配置';
        clientFetch(API.playlist.config()).then(setConfig);
    }, []);

    useEffect(() => {
        if (!config) return;
        resourcePrefixInputRef.current!.value = config.resourcePrefix;
    }, [config]);

    return (
        <>
            <div className="page">
                <h1>播放列表配置</h1>
                <p>版本: {config?.version}</p>
                <p>资源路径: </p>
                <Input raf={resourcePrefixInputRef} />
                <Button
                    type="primary"
                    onClick={async () => {
                        try {
                            const newConfig = await clientFetch(
                                API.playlist.updateConfig({
                                    resourcePrefix: resourcePrefixInputRef.current?.value,
                                }),
                            );
                            setConfig(newConfig);
                            alert('保存成功');
                        } catch (e: any) {
                            alert('保存失败');
                            Logger.error('保存失败', e);
                        }
                    }}
                >
                    保 存
                </Button>
            </div>
        </>
    );
}
