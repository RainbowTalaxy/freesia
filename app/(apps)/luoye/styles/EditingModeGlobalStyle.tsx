'use client';
import homeStyles from './home.module.css';
import layoutStyles from './layout.module.css';
import documentStyles from './document.module.css';
import { createGlobalStyle } from 'styled-components';

const EditingModeGlobalStyle = createGlobalStyle`
    html, body {
        height: 100%;
    }

    .${homeStyles.container},
    .${layoutStyles.pageView},
    .${layoutStyles.contentView},
    .${layoutStyles.content},
    .${documentStyles.docView} {
        height: 100%;
        overflow: auto;
    }
`;

export default EditingModeGlobalStyle;
