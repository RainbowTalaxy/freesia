import { useRef } from 'react';
import { IS_SERVER } from '../constants';

const useHydrationEffect = (effect: () => void) => {
    const isExecuted = useRef(false);

    if (IS_SERVER || !isExecuted.current) {
        effect();
        isExecuted.current = true;
    }
};

export default useHydrationEffect;
