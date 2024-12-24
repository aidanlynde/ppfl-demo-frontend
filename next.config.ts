/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/fl/:path*',
        destination: `${process.env.NEXT_PUBLIC_FL_API_URL}/api/fl/:path*`,
      },
      {
        source: '/api/session/:path*',
        destination: `${process.env.NEXT_PUBLIC_FL_API_URL}/api/session/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
