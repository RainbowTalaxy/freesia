import { useEffect } from 'react';
import { Logger } from '../utils';

const useDebugRenderCommit = (componentName: string) => {
    useEffect(() => {
        Logger.info('🎨', componentName, 'render committed');
    });
};

export default useDebugRenderCommit;
