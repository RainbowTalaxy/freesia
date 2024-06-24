const isStandalone = process.env.STANDALONE === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/freesia',
    rewrites: () => {
        return [
            {
                source: '/api/:path*',
                destination: 'https://blog.talaxy.cn/api/:path*',
                basePath: false,
            },
        ];
    },
    output: isStandalone ? 'standalone' : undefined,
};

export default nextConfig;
