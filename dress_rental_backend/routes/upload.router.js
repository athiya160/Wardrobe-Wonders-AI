import { Router } from "express";
import { uploadMiddleware, processUploads } from "../services/uploadService.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const uploadRouter = new Router();

// Middleware to wrap multer and catch upload errors gracefully (e.g. file size, format)
const handleUpload = (req, res, next) => {
  const upload = uploadMiddleware.fields([
    { name: "images", maxCount: 5 },
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]);

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed due to invalid file or size limits.",
      });
    }
    next();
  });
};

/**
 * Helper to extract files from req.files or req.file
 */
const extractFiles = (req) => {
  const files = [];
  if (req.files) {
    if (req.files.images) files.push(...req.files.images);
    if (req.files.image) files.push(...req.files.image);
    if (req.files.file) files.push(...req.files.file);
  } else if (req.file) {
    files.push(req.file);
  }
  return files;
};

/**
 * POST /upload/provider (or /provider/upload)
 * Authenticated endpoint for providers to upload dress photography
 */
uploadRouter.post(
  "/provider",
  authenticateToken,
  requireRole("provider", "admin"),
  handleUpload,
  async (req, res) => {
    try {
      const files = extractFiles(req);
      if (!files || files.length === 0) {
        return res.status(400).json({
          status: false,
          message: "No image files were uploaded. Please attach at least one image.",
        });
      }

      const results = await processUploads(files, req);
      const urls = results.map((r) => r.url);

      res.status(200).json({
        status: true,
        message: "Images uploaded successfully",
        storage: results[0]?.storage || "local_disk",
        urls: urls,
        primaryUrl: urls[0],
        total: urls.length,
      });
    } catch (err) {
      console.error("Provider upload error:", err);
      res.status(500).json({
        status: false,
        message: "Internal server error while processing image upload.",
        error: err.message,
      });
    }
  }
);

/**
 * POST /upload
 * General authenticated upload endpoint
 */
uploadRouter.post(
  "/",
  authenticateToken,
  handleUpload,
  async (req, res) => {
    try {
      const files = extractFiles(req);
      if (!files || files.length === 0) {
        return res.status(400).json({
          status: false,
          message: "No image files were uploaded.",
        });
      }

      const results = await processUploads(files, req);
      const urls = results.map((r) => r.url);

      res.status(200).json({
        status: true,
        message: "Image uploaded successfully",
        storage: results[0]?.storage || "local_disk",
        urls: urls,
        primaryUrl: urls[0],
      });
    } catch (err) {
      console.error("General upload error:", err);
      res.status(500).json({
        status: false,
        message: "Internal server error while uploading image.",
        error: err.message,
      });
    }
  }
);

export default uploadRouter;
