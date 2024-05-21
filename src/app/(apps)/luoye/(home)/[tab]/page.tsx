import DocBin from '../pages/DocBin';
import Settings from '../pages/Settings';

interface Props {
    params: {
        tab: string;
    };
}

export default async function Page({ params }: Props) {
    const { tab } = params;

    switch (tab) {
        case 'doc-bin':
            return <DocBin />;
        case 'settings':
            return <Settings />;
        default:
            return null;
    }
}
