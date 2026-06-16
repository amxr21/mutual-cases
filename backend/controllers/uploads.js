/**
 * Image upload signing (Cloudinary).
 *
 * The browser uploads the file *directly* to Cloudinary using a short-lived
 * signature minted here — so the file never passes through our API and the
 * Cloudinary API secret never reaches the client. Mirrors the email mailer's
 * graceful-degradation: when Cloudinary isn't configured, this reports
 * `configured: false` (and the admin UI falls back to pasting a URL).
 *
 * Mounted behind requireAdmin in adminRoutes.
 */
const crypto = require("crypto");
const config = require("../config");

/** GET /admin/uploads/config — does the dashboard have uploads available? */
const getUploadConfig = (_req, res) => {
    res.json({ configured: config.cloudinary.enabled });
};

/**
 * POST /admin/uploads/sign — returns the params the browser needs to POST a file
 * straight to Cloudinary's upload endpoint.
 *
 * Body (optional): { folder }
 * Response: { configured, cloudName, apiKey, timestamp, folder, signature, uploadUrl }
 */
const signUpload = (req, res) => {
    if (!config.cloudinary.enabled) {
        return res.json({ configured: false });
    }

    const { cloudName, apiKey, apiSecret, uploadFolder } = config.cloudinary;
    const folder = (req.body && req.body.folder) || uploadFolder;
    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary signs the SHA-1 of the sorted params + the api secret.
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

    res.json({
        configured: true,
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    });
};

module.exports = { getUploadConfig, signUpload };
