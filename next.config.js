/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Generate a static site
  images: {
    unoptimized: true, // Disable image optimization for static export
  },
  experimental: {
    optimizeCss: false, // Disable CSS optimization (optional)
  },
  trailingSlash: true, // Ensure static export works with trailing slashes
};

module.exports = nextConfig;
