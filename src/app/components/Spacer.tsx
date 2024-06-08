interface Props {
    className?: string;
    onClick?: () => void;
}

const Spacer = ({ className, onClick }: Props) => {
    return (
        <div className={className} style={{ flexGrow: 1 }} onClick={onClick} />
    );
};

export default Spacer;
