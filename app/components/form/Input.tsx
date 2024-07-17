import { HTMLInputTypeAttribute, RefObject } from 'react';
import clsx from 'clsx';

interface Props {
    raf?: RefObject<HTMLInputElement>;
    id?: string;
    className?: string;
    name?: string;
    value?: string;
    placeholder?: string;
    type?: HTMLInputTypeAttribute;
    defaultValue?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = ({
    raf,
    id,
    className,
    name,
    value,
    placeholder,
    type,
    defaultValue,
    onChange,
}: Props) => {
    return (
        <input
            id={id}
            className={clsx('input', className)}
            ref={raf}
            type={type}
            name={name}
            value={value}
            placeholder={placeholder}
            defaultValue={defaultValue}
            spellCheck={false}
            autoComplete="off"
            onChange={onChange}
        />
    );
};

export default Input;
