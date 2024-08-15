import clsx from 'clsx';

interface Props {
    name: string;
    className?: string;
}

const Icon = ({ name, className }: Props) => {
    return (
        <span className={clsx('material-symbols-outlined', className)}>
            {name}
        </span>
    );
};

export default Icon;
