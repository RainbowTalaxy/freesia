import styles from './style.module.css';
import { Button } from '@/components/form';
import Icon from '../Icon';

interface Props {
    iconName: string;
    children: string;
    onClick: () => void;
}

const ActionButton = ({ iconName, children, onClick }: Props) => {
    return (
        <Button className={styles.actionBtn} type="primary" onClick={onClick}>
            <Icon className={styles.icon} name={iconName} fill />
            {children}
        </Button>
    );
};

export default ActionButton;
