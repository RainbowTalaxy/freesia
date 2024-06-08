import styles from '../styles/home.module.css';

interface Props {
    children: string;
}

const Placeholder = ({ children }: Props) => {
    return <span className={styles.placeholder}>{children}</span>;
};

export default Placeholder;
