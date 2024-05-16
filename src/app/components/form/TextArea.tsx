import { RefObject } from 'react';
import clsx from 'clsx';

interface Props {
    className?: string;
    raf?: RefObject<HTMLTextAreaElement>;
}

const TextArea = ({ raf, className }: Props) => {
    return <textarea className={clsx('textarea', className)} ref={raf} />;
};

export default TextArea;
