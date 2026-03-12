/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Copy .wasm files from node_modules to the build output
  outputFileTracingIncludes: {
    '/api/publish': [
      './node_modules/@shelby-protocol/clay-codes/dist/**/*.wasm',
      './node_modules/@shelby-protocol/**/*.wasm',
    ],
    '/api/stream': [
      './node_modules/@shelby-protocol/clay-codes/dist/**/*.wasm',
      './node_modules/@shelby-protocol/**/*.wasm',
    ],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.b-cdn.net' },
      { protocol: 'https', hostname: 'api.testnet.shelby.xyz' },
      { protocol: 'https', hostname: 'api.shelbynet.shelby.xyz' },
    ],
  },

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

  webpack: (config, { isServer }) => {
    // Handle .wasm files
    config.experiments = { ...config.experiments, asyncWebAssembly: true }

    if (!isServer) {
      // These Node.js-only packages must never be bundled for the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        got: false,
        'node-fetch': false,
        http: false,
        https: false,
        net: false,
        tls: false,
        fs: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        zlib: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
