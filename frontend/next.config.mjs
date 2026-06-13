/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Google profile images
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Seeded random sample photos
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Google Drive thumbnails (used by ProductImage for real product photos)
      { protocol: "https", hostname: "drive.google.com" },
    ],
  },
};

export default nextConfig;
