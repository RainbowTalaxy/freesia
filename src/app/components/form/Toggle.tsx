import { RefObject } from 'react';

interface Props {
    raf?: RefObject<HTMLInputElement>;
}

const Toggle = ({ raf }: Props) => {
    return (
        <label className="toggle">
            <input ref={raf} type="checkbox" />
            <span className="toggle-slider"></span>
        </label>
    );
};

export default Toggle;
