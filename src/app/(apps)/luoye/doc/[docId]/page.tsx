import { PROJECT_NAME } from '../../configs';
import { fetchDocInfo } from './cache';

type Params = {
    docId: string;
};

export async function generateMetadata({ params }: { params: Params }) {
    const docInfo = await fetchDocInfo(params.docId);
    const { doc } = docInfo;
    return {
        title: `${doc ? doc.name || '未命名' : '文档不存在'} | ${PROJECT_NAME}`,
    };
}

interface Props {
    params: Params;
}

export default async function Page({ params }: Props) {
    return <div>Hello</div>;
}
