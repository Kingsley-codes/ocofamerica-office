const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const streamifier = require("streamifier");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ALLOWED MIME TYPES
const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

// COMMON FILE FILTER
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPG, PNG, JPEG, and WEBP images are allowed.",
      ),
      false,
    );
  }
};

const resourceStorage = multer.memoryStorage();

const uploadProfilePhoto = multer({
  storage: resourceStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).fields([{ name: "profilePhoto", maxCount: 1 }]);

const uploadLogo = multer({
  storage: resourceStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
}).fields([{ name: "logo", maxCount: 1 }]);

// 🚧 Middleware wrapper to catch Multer errors cleanly
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 10 MB per file.",
      });
    }
    return res.status(400).json({
      error: `Upload error: ${err.message}`,
    });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Helper function to upload image buffer to Cloudinary
const uploadImageToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);

        if (!result) {
          return reject(new Error("Cloudinary upload failed: no result"));
        }

        resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const deleteFromCloudinary = (publicId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

// ✅ EXPORTS
module.exports = {
  uploadProfilePhoto,
  uploadLogo,
  handleUploadErrors,
  uploadImageToCloudinary,
  deleteFromCloudinary,
};
