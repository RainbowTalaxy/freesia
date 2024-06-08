import { generateDocPageTitle } from '../../configs';
import Document from '../../containers/Document';
import { fetchDocInfo } from './cache';

interface Params {
    docId: string;
}

export async function generateMetadata({ params }: { params: Params }) {
    const docInfo = await fetchDocInfo(params.docId);
    const { doc } = docInfo;
    return {
        title: generateDocPageTitle(doc),
    };
}

export default async function Page() {
    return <Document />;
}
