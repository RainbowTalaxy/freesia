import { HTMLProps } from 'react';

export default function Img(props: HTMLProps<HTMLImageElement>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img referrerPolicy="no-referrer" loading="lazy" {...props} />;
}
