/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.pdf$/i,
      type: "asset/source",
    });

    return config;
  },
  productionBrowserSourceMaps: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  transpilePackages: ["ui"],
};

module.exports = nextConfig;
