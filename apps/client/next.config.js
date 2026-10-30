/**
 * Sent with every response.
 *
 * The CSP is deliberately narrow: it stops other sites framing the app
 * (clickjacking on "Apply change" / "Start trade"), plugins, and <base> /
 * form hijacks, without restricting where scripts and styles load from —
 * an allowlist for those needs testing against GA, SendX, fonts, Cloudinary
 * and the API before it can be enforced.
 *
 * Camera stays allowed for the Yellow Card widget on /buy-crypto, which
 * uses it for ID checks.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  {
    key: "Permissions-Policy",
    value: 'camera=(self "https://widget.yellowcard.io"), microphone=(), geolocation=()',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
