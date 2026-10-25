/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV === 'development';
const apiTarget =
    process.env.LUOYE_API_TARGET ??
    (isDevelopment ? 'http://localhost:4000' : 'https://blog.talaxy.cn');

const nextConfig = {
    basePath: '/freesia',
    rewrites: () => {
        return [
            {
                source: '/api/:path*',
                destination:
                    apiTarget +
                    (isDevelopment ? '/:path*' : '/api/:path*'),
                basePath: false,
            },
        ];
    },
};

export default nextConfig;
