/**
 * Production is a static export: `next build` writes plain files to `out/`,
 * which are uploaded to cPanel's public_html — no Node.js on the server.
 *
 * Dynamic pages (/blog/[id], /dashboard/trades/[id], …) have no data
 * fetching, so each is exported once as a literal file —
 * out/blog/[id]/index.html — and public/.htaccess serves it for every real
 * id. The page reads its id from the address in the browser, as it always
 * has. That only holds while those pages stay free of getStaticProps /
 * getServerSideProps, and the app keeps no API routes, rewrites or
 * middleware: `next dev` refuses all of those under `output: "export"`, so
 * adding one shows up straight away.
 *
 * Security headers and the dynamic-page rewrites live in public/.htaccess,
 * which Apache reads; a static export cannot send headers itself.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  swcMinify: false,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.pdf$/i,
      type: "asset/source",
    });

    return config;
  },
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
    domains: ["api.dicebear.com", "res.cloudinary.com"],
  },
  trailingSlash: true,
  transpilePackages: ["ui"],
};

module.exports = nextConfig;
