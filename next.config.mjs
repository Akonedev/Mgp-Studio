/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder'],
  allowedDevOrigins: ['127.0.0.1', 'localhost', '127.0.0.1:58101', 'localhost:58101'],
};

export default nextConfig;
