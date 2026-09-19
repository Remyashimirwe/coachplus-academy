import { v2 as cloudinary } from "cloudinary";

let configured = false;

function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

/**
 * Uploads a file buffer to Cloudinary and returns its secure URL + public id.
 * Uses `resource_type: "auto"` so both images and raw files (pdf, doc, etc.)
 * are handled correctly.
 */
export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { folder: string; filename?: string }
): Promise<CloudinaryUploadResult> {
  const client = getCloudinaryClient();

  if (!client) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "auto",
        filename_override: options.filename,
        use_filename: Boolean(options.filename),
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function getCloudinaryDocumentUrl(
  publicId: string,
  options: { download: boolean; filename: string }
) {
  const client = getCloudinaryClient();
  if (!client || !publicId) return null;

  return client.url(publicId, {
    secure: true,
    resource_type: "image",
    type: "upload",
    sign_url: true,
    flags: options.download ? `attachment:${options.filename}` : undefined,
  });
}
