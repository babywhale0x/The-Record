/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow the Shelby CDN domain for image/asset optimisation
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.b-cdn.net' },
      { protocol: 'https', hostname: 'api.testnet.shelby.xyz' },
      { protocol: 'https', hostname: 'api.shelbynet.shelby.xyz' },
    ],
  },

  // Headers for blob streaming routes
  async headers() {
    return [
      {
        source: '/api/stream/:path*',
        headers: [
          { key: 'Accept-Ranges', value: 'bytes' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
