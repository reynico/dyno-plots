/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static client-side build — deployable to Cloudflare Pages / Vercel
  // with zero server runtime.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
