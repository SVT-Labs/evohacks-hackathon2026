/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // unpdf ships its own pre-bundled build of pdf.js. Keeping it external lets
    // Node load that file as it is instead of webpack re-bundling it.
    serverComponentsExternalPackages: ["unpdf"],
  },
};

export default nextConfig;
