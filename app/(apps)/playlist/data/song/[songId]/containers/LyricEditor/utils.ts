import { Line } from './types';

export const lineText = (line: Line) => {
    return line.main.map((item) => item.content).join('');
};
