import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer memory storage configuration (allows streaming to Cloudinary or writing to local disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Only valid image files (JPEG, PNG, WEBP, GIF) are allowed."), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5, // up to 5 images per request
  },
  fileFilter,
});

/**
 * Check if Cloudinary credentials are fully configured
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload a single in-memory file buffer to Cloudinary or local disk
 */
export const saveFile = async (file, req) => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "wardrobe_wonders/dresses",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload failed, falling back to local:", error);
            // On Cloudinary error, seamlessly fall back to local disk
            saveToLocal(file, req).then(resolve).catch(reject);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              storage: "cloudinary",
            });
          }
        }
      );
      uploadStream.end(file.buffer);
    });
  } else {
    return saveToLocal(file, req);
  }
};

/**
 * Save file to local uploads directory
 */
const saveToLocal = async (file, req) => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const ext = path.extname(file.originalname) || ".jpg";
  const uniqueName = `dress_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
  const targetPath = path.join(UPLOADS_DIR, uniqueName);

  await fs.promises.writeFile(targetPath, file.buffer);

  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:4000";
  const fileUrl = `${protocol}://${host}/uploads/${uniqueName}`;

  return {
    url: fileUrl,
    filename: uniqueName,
    storage: "local_disk",
  };
};

/**
 * Process single or multiple uploaded files
 */
export const processUploads = async (files, req) => {
  const fileList = Array.isArray(files) ? files : [files];
  const results = [];

  for (const file of fileList) {
    if (file && file.buffer) {
      const saved = await saveFile(file, req);
      results.push(saved);
    }
  }

  return results;
};
