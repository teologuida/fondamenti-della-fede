/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",            // sito statico → ottimo per Vercel e per il futuro PWA
  trailingSlash: true,         // URL puliti /prefazione/ anche da hosting statico
  images: { unoptimized: true }
};
export default nextConfig;
