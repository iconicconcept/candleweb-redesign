const withTM = require("next-transpile-modules")(["ui"]);

module.exports = withTM({
  reactStrictMode: true,
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
  // distDir: "build",
});
