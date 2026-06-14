import { RefObject, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
    raf?: RefObject<HTMLTextAreaElement>;
}

const TextArea = ({ raf, className, ...rest }: Props) => {
    return (
        <textarea {...rest} className={clsx('textarea', className)} ref={raf} />
    );
};

export default TextArea;
