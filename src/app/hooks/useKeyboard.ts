import { useEffect } from 'react';

const useKeyboard = (
    key: string | string[],
    event: () => void,
    options: {
        ctrl?: boolean;
        up?: boolean;
    } = {
        ctrl: false,
        up: false,
    },
) => {
    useEffect(() => {
        const callback = (e: KeyboardEvent) => {
            const metaKey = navigator.platform.includes('Mac')
                ? e.metaKey
                : e.ctrlKey;
            if (options.ctrl && !metaKey) return;
            if (typeof key === 'string') {
                if (key !== e.key) return;
            } else {
                if (!key.includes(e.key)) return;
            }
            e.preventDefault();
            event();
            return false;
        };
        const eventName = options.up ? 'keyup' : 'keydown';
        document.addEventListener(eventName, callback);
        return () => document.removeEventListener(eventName, callback);
    }, [key, event, options.ctrl, options.up]);
};

export default useKeyboard;
