import dynamic from 'next/dynamic';

export { default as TextEditor } from './TextEditor';
export * from './configs';

export const MarkdownEditor = dynamic(() => import('./MarkdownEditor'), {
    ssr: false,
});
