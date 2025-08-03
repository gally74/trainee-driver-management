/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/trainee-driver-management' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/trainee-driver-management/' : '',
}

module.exports = nextConfig 