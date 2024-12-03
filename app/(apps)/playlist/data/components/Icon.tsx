import clsx from 'clsx';

interface Props {
    name: string;
    className?: string;
    fill?: boolean;
}

const Icon = ({ name, className, fill = false }: Props) => {
    return (
        <span
            className={clsx('material-symbols-outlined', className)}
            style={{
                fontVariationSettings: fill ? '"FILL" 1' : '"FILL" 0',
            }}
        >
            {name}
        </span>
    );
};

export default Icon;
