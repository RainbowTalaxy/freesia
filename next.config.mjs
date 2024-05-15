/** @type {import('next').NextConfig} */
const nextConfig = {
    rewrites: () => {
        return [
            {
                source: '/api/:path*',
                destination: 'https://blog.talaxy.cn/api/:path*',
            },
        ];
    },
};

export default nextConfig;
