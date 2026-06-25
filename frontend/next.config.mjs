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
  async headers() {
    return [
      {
        // Google Identity Services signs the user in via a popup that posts the
        // credential back to this window with window.postMessage. A strict COOP
        // ('same-origin') severs the opener<->popup link and the browser blocks
        // that postMessage, so the popup closes without ever delivering the
        // credential — sign-in silently fails. 'same-origin-allow-popups' keeps
        // the isolation guarantee (other origins still can't grab our window)
        // while permitting popups WE open to message us back.
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
