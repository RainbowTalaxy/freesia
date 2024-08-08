import style from './style.module.css';
import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

const ButtonGroup = ({ children }: Props) => {
    return <div className={style.buttonGroup}>{children}</div>;
};

export default ButtonGroup;
