/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  async rewrites() {
    return {
      beforeFiles: [
        // Wildcard subdomain → /[slug] route, handled in middleware too for clarity.
      ],
    };
  },
};
export default nextConfig;
