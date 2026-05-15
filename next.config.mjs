/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static client-side build — deployable to Cloudflare Pages / Vercel
  // with zero server runtime.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Dev server is reached via a non-localhost hostname (container behind
  // projects.vm.home); without this Next 16 blocks dev assets/HMR cross-origin.
  allowedDevOrigins: ["projects.vm.home", "*.vm.home"],
};

export default nextConfig;
