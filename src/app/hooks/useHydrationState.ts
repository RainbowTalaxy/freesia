import { useEffect, useRef, useState } from 'react';

const state = new Map<string, any>();

function useHydrationState<T>(serverData: T, key: string) {
    const serverDataRef = useRef(serverData);
    const [value, setValue] = useState<T>(state.get(key) ?? serverData);

    useEffect(() => {
        state.set(key, value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useEffect(() => {
        if (serverDataRef.current !== serverData) {
            setValue(serverData);
            serverDataRef.current = serverData;
        }
    }, [serverData]);

    return [value, setValue] as const;
}

export default useHydrationState;
