/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse loads its bundled pdf.js build with a dynamic require, which
    // webpack cannot follow. Keeping it external makes Node load it from
    // node_modules at runtime instead.
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
