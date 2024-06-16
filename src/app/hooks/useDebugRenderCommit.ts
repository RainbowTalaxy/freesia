import { useEffect } from 'react';
import { Logger } from '../utils';

const useDebugRenderCommit = (componentName: string) => {
    Logger.render(componentName);

    useEffect(() => {
        Logger.info('🎨', componentName, 'render committed');
    });
};

export default useDebugRenderCommit;
