import { ReactNode, RefObject } from 'react';
import clsx from 'clsx';

interface Props {
    className?: string;
    raf?: RefObject<HTMLSelectElement>;
    options?: Array<{
        value: string;
        label: string;
    }>;
    children?: ReactNode;
    defaultValue?: string;
}

const Select = ({ raf, className, options, children, defaultValue }: Props) => {
    return (
        <select
            className={clsx('select', className)}
            ref={raf}
            defaultValue={defaultValue}
        >
            {options?.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
            {children}
        </select>
    );
};

export default Select;
