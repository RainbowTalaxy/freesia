import { useEffect, useState } from 'react';

const state = new Map<string, any>();

function useHydrationState<T>(serverValue: T, key: string) {
    const [value, setValue] = useState<T>(state.get(key) ?? serverValue);

    useEffect(() => {
        state.set(key, value);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return [value, setValue] as const;
}

export default useHydrationState;
