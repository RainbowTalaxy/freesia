import nextConfig from '../../next.config.mjs';

export const BASE_PATH = nextConfig.basePath;

export const IS_SERVER = typeof window === 'undefined';
